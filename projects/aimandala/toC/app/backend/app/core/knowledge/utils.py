"""
知识库工具函数

提供通用的降级策略、缓存管理等工具函数
"""

from typing import Callable, Any, Optional, TypeVar
from functools import wraps

T = TypeVar("T")


class FallbackChain:
    """
    降级链

    按优先级依次尝试多个查询源，直到获得有效结果
    """

    def __init__(self, cache_enabled: bool = True):
        self.cache_enabled = cache_enabled
        self._cache: dict = {}

    def query(
        self, cache_key: Optional[str], *sources: tuple[Callable, str, bool]
    ) -> tuple[Any, str, bool]:
        """
        执行降级查询

        Args:
            cache_key: 缓存键，None表示不缓存
            sources: 查询源元组列表，每个元组为 (callable, source_name, is_fallback)
                    按优先级排序，先尝试的在前

        Returns:
            (结果, 来源, 是否降级)

        Example:
            result, source, is_fallback = fallback_chain.query(
                "color:red:general",
                (lambda: get_theme_color("red"), "theme", False),
                (lambda: get_general_color("red"), "general", False),
                (lambda: get_basic_color("red"), "basic", True),
            )
        """
        # 1. 尝试缓存
        if self.cache_enabled and cache_key and cache_key in self._cache:
            cached = self._cache[cache_key]
            return cached, "cache", False

        # 2. 按优先级尝试各个查询源
        for callable_fn, source_name, is_fallback in sources:
            try:
                result = callable_fn()
                if result and result != "暂无特化解读":
                    # 缓存结果
                    if self.cache_enabled and cache_key:
                        self._cache[cache_key] = result
                    return result, source_name, is_fallback
            except Exception:
                continue

        # 3. 所有源都失败
        return None, "none", True

    def clear_cache(self):
        """清空缓存"""
        self._cache.clear()

    def get_cache_stats(self) -> dict:
        """获取缓存统计"""
        return {"size": len(self._cache), "keys": list(self._cache.keys())[:10]}


def with_fallback(*sources: tuple[Callable, str]):
    """
    降级装饰器

    为查询函数添加降级策略

    Args:
        sources: 查询源元组列表 (callable, source_name)
                按优先级排序

    Example:
        @with_fallback(
            (get_theme_color, "theme"),
            (get_general_color, "general"),
            (get_basic_color, "basic"),
        )
        def get_color_meaning(color: str) -> str:
            # 默认实现
            return f"颜色 {color} 的含义"
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> tuple[Any, str, bool]:
            # 依次尝试各个源
            for source_callable, source_name in sources:
                try:
                    if callable(source_callable):
                        result = source_callable(*args, **kwargs)
                    else:
                        # 如果传入的是值而非 callable
                        result = source_callable

                    if result:
                        is_fallback = source_name != sources[0][1]
                        return result, source_name, is_fallback
                except Exception:
                    continue

            # 所有源都失败，调用原函数
            return func(*args, **kwargs), "default", True

        return wrapper

    return decorator


def safe_query(
    query_fn: Callable[..., T],
    *args,
    default: T = None,
    error_handler: Optional[Callable[[Exception], T]] = None,
    **kwargs,
) -> T:
    """
    安全查询

    包装查询函数，捕获异常并返回默认值

    Args:
        query_fn: 查询函数
        args: 位置参数
        default: 默认值
        error_handler: 错误处理函数
        kwargs: 关键字参数

    Returns:
        查询结果或默认值

    Example:
        result = safe_query(
            get_color_meaning,
            "红色",
            default={"meaning": "未知"}
        )
    """
    try:
        return query_fn(*args, **kwargs)
    except Exception as e:
        if error_handler:
            return error_handler(e)
        return default


class LazyImporter:
    """
    延迟导入器

    解决循环导入问题

    Example:
        healing = LazyImporter("core.healing", ["get_healing_program"])

        # 使用时才真正导入
        program = healing.get_healing_program()
    """

    def __init__(self, module_path: str, names: list[str]):
        self.module_path = module_path
        self.names = names
        self._module = None
        self._loaded = False

    def _load(self):
        """延迟加载模块"""
        if not self._loaded:
            import importlib

            self._module = importlib.import_module(self.module_path)
            self._loaded = True

    def __getattr__(self, name: str):
        if name not in self.names:
            raise AttributeError(f"'{self.module_path}' has no attribute '{name}'")

        self._load()

        if self._module and hasattr(self._module, name):
            return getattr(self._module, name)

        raise AttributeError(f"'{self.module_path}' has no attribute '{name}'")


# 便捷函数


def chain_queries(*queries: tuple[Callable, ...]) -> Any:
    """
    链式查询

    按顺序尝试多个查询，返回第一个成功的结果

    Args:
        queries: 查询函数元组 (callable, *args, **kwargs)

    Returns:
        第一个成功的结果，或 None

    Example:
        result = chain_queries(
            (get_theme_color, "red", "general"),
            (get_general_color, "red"),
            (lambda: {"meaning": "默认含义"}),
        )
    """
    for query_tuple in queries:
        callable_fn = query_tuple[0]
        args = query_tuple[1:] if len(query_tuple) > 1 else ()
        kwargs = {}

        # 处理 dict 作为最后一个参数（关键字参数）
        if args and isinstance(args[-1], dict):
            kwargs = args[-1]
            args = args[:-1]

        try:
            result = callable_fn(*args, **kwargs)
            if result:
                return result
        except Exception:
            continue

    return None


__all__ = [
    "FallbackChain",
    "with_fallback",
    "safe_query",
    "LazyImporter",
    "chain_queries",
]
