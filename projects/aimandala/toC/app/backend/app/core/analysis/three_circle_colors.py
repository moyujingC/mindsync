"""
三圈颜色提取模块

根据用户设定的三圈配置（内圈、中圈半径），使用OpenCV提取曼陀罗图像
在三个区域的颜色分布。
"""

import os
import math
import cv2
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class FiveElement(str, Enum):
    """五行元素"""

    WOOD = "wood"
    FIRE = "fire"
    EARTH = "earth"
    METAL = "metal"
    WATER = "water"


# 五行颜色范围（HSV色彩空间）
# H: 0-179 (OpenCV中H范围是0-179，对应0-360度)
# S: 0-255
# V: 0-255
FIVE_ELEMENT_HSV_RANGES = {
    FiveElement.WOOD: [
        # 绿色范围
        {"lower": [35, 40, 40], "upper": [85, 255, 255]},
        # 青色范围
        {"lower": [85, 40, 40], "upper": [99, 255, 255]},
    ],
    FiveElement.FIRE: [
        # 红色范围（需要两个区间，因为红色跨越0/180度）
        {"lower": [0, 40, 40], "upper": [10, 255, 255]},
        {"lower": [160, 40, 40], "upper": [179, 255, 255]},
        # 橙色范围
        {"lower": [10, 40, 40], "upper": [25, 255, 255]},
        # 紫色范围
        {"lower": [140, 40, 40], "upper": [160, 255, 255]},
    ],
    FiveElement.EARTH: [
        # 黄色范围
        {"lower": [25, 40, 40], "upper": [35, 255, 255]},
        # 棕色/土色范围（低亮度黄色/橙色）
        {"lower": [20, 60, 20], "upper": [40, 255, 150]},
        # 米色/浅棕色
        {"lower": [20, 20, 100], "upper": [40, 100, 200]},
    ],
    FiveElement.METAL: [
        # 白色范围（低饱和度，高亮度）
        {"lower": [0, 0, 200], "upper": [179, 30, 255]},
        # 金色/淡黄色（低饱和度黄色）
        {"lower": [20, 20, 150], "upper": [40, 100, 255]},
        # 银色/灰色
        {"lower": [0, 0, 100], "upper": [179, 30, 200]},
    ],
    FiveElement.WATER: [
        # 蓝色范围
        {"lower": [100, 40, 40], "upper": [130, 255, 255]},
        # 深蓝色/靛蓝
        {"lower": [130, 40, 20], "upper": [140, 255, 255]},
        # 黑色（低亮度）
        {"lower": [0, 0, 0], "upper": [179, 255, 30]},
        # 深蓝色（接近黑色）
        {"lower": [100, 50, 0], "upper": [140, 255, 50]},
    ],
}

# 五行中文名称映射
ELEMENT_NAMES_CN = {
    FiveElement.WOOD: "木",
    FiveElement.FIRE: "火",
    FiveElement.EARTH: "土",
    FiveElement.METAL: "金",
    FiveElement.WATER: "水",
}


@dataclass
class CircleColorData:
    """单个圈的颜色数据"""

    colors: List[Dict[str, Any]]  # 颜色列表，包含hex、rgb、percentage
    five_elements: Dict[str, float]  # 五行分布百分比
    dominant_color: str  # 主导颜色（hex）
    dominant_element: str  # 主导五行元素


@dataclass
class ThreeCircleColorResult:
    """三圈颜色分析结果"""

    inner: CircleColorData  # 内圈
    middle: CircleColorData  # 中圈
    outer: CircleColorData  # 外圈

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            "inner": {
                "colors": self.inner.colors,
                "five_elements": self.inner.five_elements,
                "dominant_color": self.inner.dominant_color,
                "dominant_element": self.inner.dominant_element,
            },
            "middle": {
                "colors": self.middle.colors,
                "five_elements": self.middle.five_elements,
                "dominant_color": self.middle.dominant_color,
                "dominant_element": self.middle.dominant_element,
            },
            "outer": {
                "colors": self.outer.colors,
                "five_elements": self.outer.five_elements,
                "dominant_color": self.outer.dominant_color,
                "dominant_element": self.outer.dominant_element,
            },
        }


def create_circle_mask(
    image_shape: Tuple[int, int],
    center: Tuple[int, int],
    inner_radius: int,
    outer_radius: int,
) -> np.ndarray:
    """
    创建环形遮罩

    Args:
        image_shape: 图像尺寸 (height, width)
        center: 中心点坐标 (x, y)
        inner_radius: 内半径（像素）
        outer_radius: 外半径（像素）

    Returns:
        np.ndarray: 二值遮罩图像
    """
    mask = np.zeros(image_shape[:2], dtype=np.uint8)

    # 绘制外圆（填充）
    cv2.circle(mask, center, outer_radius, 255, -1)

    # 如果有内半径，绘制内圆（挖空）
    if inner_radius > 0:
        cv2.circle(mask, center, inner_radius, 0, -1)

    return mask


def extract_dominant_colors(
    image: np.ndarray, mask: np.ndarray, k: int = 5
) -> List[Dict[str, Any]]:
    """
    使用K-means提取主色调

    Args:
        image: BGR图像
        mask: 二值遮罩
        k: 聚类数量

    Returns:
        List[Dict]: 主色调列表，包含hex、rgb、percentage
    """
    # 转换到RGB空间
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # 获取遮罩区域内的像素
    pixels = image_rgb[mask > 0]

    if len(pixels) == 0:
        return []

    # 注意：这里不再过滤掉高亮低饱和像素。
    # 按当前 Layer0 首层口径，圆盘内白色、留白、镂空白块都要作为正常白色色块参与统计；
    # 圆盘外背景已经由 mask 排除，因此这里直接保留圆盘内全部像素。

    # K-means聚类
    pixels = np.float32(pixels)

    # 限制像素数量以提高性能
    if len(pixels) > 10000:
        indices = np.random.choice(len(pixels), 10000, replace=False)
        pixels = pixels[indices]

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)

    # 动态调整k值
    actual_k = min(k, len(pixels))
    if actual_k < 2:
        actual_k = 2

    _, labels, centers = cv2.kmeans(
        pixels, actual_k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
    )

    # 计算每个聚类的占比
    counts = np.bincount(labels.flatten(), minlength=actual_k)
    percentages = counts / counts.sum() * 100

    # 构建结果
    colors = []
    for i, (center, pct) in enumerate(zip(centers, percentages)):
        if pct < 5:  # 忽略占比小于5%的颜色
            continue

        r, g, b = int(center[0]), int(center[1]), int(center[2])
        hex_color = f"#{r:02x}{g:02x}{b:02x}"

        colors.append(
            {
                "hex": hex_color,
                "rgb": [r, g, b],
                "percentage": round(float(pct), 2),
            }
        )

    # 按占比排序
    colors.sort(key=lambda x: x["percentage"], reverse=True)

    return colors


def _pixel_brightness(rgb: tuple[int, int, int]) -> float:
    red, green, blue = rgb
    return 0.299 * red + 0.587 * green + 0.114 * blue


def _pixel_saturation(rgb: tuple[int, int, int]) -> float:
    red, green, blue = rgb
    max_channel = max(red, green, blue)
    min_channel = min(red, green, blue)
    if max_channel == 0:
        return 0.0
    return ((max_channel - min_channel) / max_channel) * 255.0


def _normalize_rgb_bucket(rgb: tuple[int, int, int], *, white_source: str) -> tuple[int, int, int]:
    if white_source != "none":
        return (248, 246, 240)
    red, green, blue = rgb
    return (
        int(round(red / 18.0) * 18),
        int(round(green / 18.0) * 18),
        int(round(blue / 18.0) * 18),
    )


def _classify_white_source(
    rgb: tuple[int, int, int],
    *,
    background_rgb: tuple[float, float, float],
) -> str:
    red, green, blue = rgb
    brightness = _pixel_brightness(rgb)
    saturation = _pixel_saturation(rgb)
    spread = max(red, green, blue) - min(red, green, blue)

    if brightness >= 244 and saturation <= 16 and spread <= 10:
        return "paper_blank"
    if brightness >= 205 and saturation <= 26 and spread <= 10:
        return "hollow_gap"
    if brightness >= 188 and saturation <= 18 and spread <= 8:
        return "painted_white"
    return "none"


def _estimate_background_rgb(image_rgb: np.ndarray) -> tuple[float, float, float]:
    height, width = image_rgb.shape[:2]
    border_thickness = max(8, int(min(width, height) * 0.06))
    border_pixels: list[tuple[int, int, int]] = []
    for y in range(height):
        for x in range(width):
            is_border = (
                x < border_thickness
                or x >= width - border_thickness
                or y < border_thickness
                or y >= height - border_thickness
            )
            if not is_border:
                continue
            red, green, blue = image_rgb[y, x]
            border_pixels.append((int(red), int(green), int(blue)))
    if not border_pixels:
        return (245.0, 245.0, 245.0)
    return (
        float(sum(pixel[0] for pixel in border_pixels) / len(border_pixels)),
        float(sum(pixel[1] for pixel in border_pixels) / len(border_pixels)),
        float(sum(pixel[2] for pixel in border_pixels) / len(border_pixels)),
    )


def _extract_segmented_blocks(
    image: np.ndarray,
    mask: np.ndarray,
    *,
    circle_name: str,
    max_blocks: int = 120,
) -> List[Dict[str, Any]]:
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    height, width = image_rgb.shape[:2]
    center_x = width / 2.0
    center_y = height / 2.0
    max_radius = min(width, height) / 2.0
    background_rgb = _estimate_background_rgb(image_rgb)

    mask_pixels = int(np.sum(mask > 0))
    if mask_pixels == 0:
        return []

    bucket_map: dict[tuple[int, int, int], np.ndarray] = {}
    white_source_map: dict[tuple[int, int, int], str] = {}

    for y in range(height):
        for x in range(width):
            if mask[y, x] == 0:
                continue
            rgb = tuple(int(value) for value in image_rgb[y, x])
            white_source = _classify_white_source(rgb, background_rgb=background_rgb)
            bucket = _normalize_rgb_bucket(rgb, white_source=white_source)
            if bucket not in bucket_map:
                bucket_map[bucket] = np.zeros((height, width), dtype=np.uint8)
                white_source_map[bucket] = white_source
            bucket_map[bucket][y, x] = 255

    block_candidates: list[Dict[str, Any]] = []
    min_area = max(24, int(mask_pixels * 0.00035))

    for bucket, bucket_mask in bucket_map.items():
        component_count, labels, stats, centroids = cv2.connectedComponentsWithStats(
            bucket_mask,
            connectivity=8,
        )
        for component_id in range(1, component_count):
            area = int(stats[component_id, cv2.CC_STAT_AREA])
            if area < min_area:
                continue
            centroid_x, centroid_y = centroids[component_id]
            component_mask = labels == component_id
            bucket_rgb = [int(bucket[0]), int(bucket[1]), int(bucket[2])]
            radial_distance = math.sqrt(
                (float(centroid_x) - center_x) ** 2 + (float(centroid_y) - center_y) ** 2
            ) / max_radius
            block_candidates.append(
                {
                    "hex": f"#{bucket[0]:02x}{bucket[1]:02x}{bucket[2]:02x}",
                    "rgb": bucket_rgb,
                    "percentage": round(area / mask_pixels * 100.0, 2),
                    "area": area,
                    "white_source": white_source_map.get(bucket, "none"),
                    "repeat_pattern": "radial_repetition",
                    "repeat_count": "unknown",
                    "position": {
                        "anchor_band_position": circle_name,
                        "radial_role": "representative_motif",
                        "symmetry_hint": f"{circle_name}_radial_repeat",
                        "component_centroid": {
                            "x_ratio": round(float(centroid_x) / width, 4),
                            "y_ratio": round(float(centroid_y) / height, 4),
                            "radius_ratio": round(radial_distance, 4),
                        },
                    },
                    "shape_hint": _classify_component_shape(component_mask, area),
                }
            )

    block_candidates.sort(key=lambda item: float(item.get("percentage", 0.0)), reverse=True)
    return block_candidates[:max_blocks]


def _classify_component_shape(component_mask: np.ndarray, area: int) -> str:
    points = np.column_stack(np.where(component_mask))
    if len(points) < 5:
        return "未能稳定判断"

    y_values = points[:, 0]
    x_values = points[:, 1]
    width = int(x_values.max() - x_values.min() + 1)
    height = int(y_values.max() - y_values.min() + 1)
    if width <= 0 or height <= 0:
        return "未能稳定判断"

    aspect_ratio = max(width, height) / max(1, min(width, height))
    extent = area / float(width * height)

    if extent <= 0.38:
        return "镂空"
    if aspect_ratio >= 2.4:
        return "条带"
    if extent >= 0.72 and abs(width - height) <= max(4, int(0.18 * max(width, height))):
        return "圆斑"
    if extent >= 0.55 and aspect_ratio <= 1.8:
        return "团块"
    if extent >= 0.4:
        return "花瓣状"
    return "不规则块"


def calculate_five_element_distribution(
    image: np.ndarray, mask: np.ndarray
) -> Dict[str, float]:
    """
    计算五行颜色分布

    Args:
        image: BGR图像
        mask: 二值遮罩

    Returns:
        Dict[str, float]: 五行分布百分比
    """
    # 转换到HSV空间
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # 获取遮罩区域内的像素
    hsv_pixels = hsv[mask > 0]

    if len(hsv_pixels) == 0:
        return {elem.value: 20.0 for elem in FiveElement}

    # 计算每个五行的像素数量
    element_counts = {elem.value: 0 for elem in FiveElement}

    for element, ranges in FIVE_ELEMENT_HSV_RANGES.items():
        element_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)

        for range_def in ranges:
            lower = np.array(range_def["lower"])
            upper = np.array(range_def["upper"])

            # 处理红色跨越0度的情况
            if element == FiveElement.FIRE and len(ranges) > 2:
                # 红色有两个区间，需要特殊处理
                mask1 = cv2.inRange(
                    hsv, np.array(ranges[0]["lower"]), np.array(ranges[0]["upper"])
                )
                mask2 = cv2.inRange(
                    hsv, np.array(ranges[1]["lower"]), np.array(ranges[1]["upper"])
                )
                element_mask = cv2.bitwise_or(mask1, mask2)
                # 添加橙色和紫色
                for range_def in ranges[2:]:
                    lower = np.array(range_def["lower"])
                    upper = np.array(range_def["upper"])
                    temp_mask = cv2.inRange(hsv, lower, upper)
                    element_mask = cv2.bitwise_or(element_mask, temp_mask)
                break
            else:
                temp_mask = cv2.inRange(hsv, lower, upper)
                element_mask = cv2.bitwise_or(element_mask, temp_mask)

        # 应用区域遮罩
        element_mask = cv2.bitwise_and(element_mask, mask)

        # 统计像素数量
        element_counts[element.value] = np.sum(element_mask > 0)

    # 计算百分比
    total = sum(element_counts.values())
    if total == 0:
        return {elem.value: 20.0 for elem in FiveElement}

    distribution = {
        elem: round(count / total * 100, 2) for elem, count in element_counts.items()
    }

    return distribution


def get_dominant_element(distribution: Dict[str, float]) -> str:
    """获取主导五行元素"""
    return max(distribution.items(), key=lambda x: x[1])[0]


def extract_colors_by_circles(
    image_path: str,
    inner_radius: float,
    middle_radius: float,
) -> Dict[str, Any]:
    """
    根据三圈配置提取颜色

    Args:
        image_path: 图像文件路径
        inner_radius: 内圈半径比例（0-1之间）
        middle_radius: 中圈半径比例（0-1之间）

    Returns:
        Dict: 三圈颜色分析结果
        {
            "inner": {"colors": [...], "five_elements": {...}, "dominant_color": "...", "dominant_element": "..."},
            "middle": {"colors": [...], "five_elements": {...}, "dominant_color": "...", "dominant_element": "..."},
            "outer": {"colors": [...], "five_elements": {...}, "dominant_color": "...", "dominant_element": "..."},
        }
    """
    # 读取图像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"无法读取图像: {image_path}")

    # 确保图像是正方形
    h, w = image.shape[:2]
    if h != w:
        # 裁剪为正方形（从中心）
        size = min(h, w)
        start_y = (h - size) // 2
        start_x = (w - size) // 2
        image = image[start_y : start_y + size, start_x : start_x + size]
        h = w = size

    # 计算中心点和半径
    center = (w // 2, h // 2)
    max_radius = w // 2

    # 转换为像素半径
    inner_radius_px = int(inner_radius * max_radius)
    middle_radius_px = int(middle_radius * max_radius)
    outer_radius_px = max_radius

    # 创建三个圈的遮罩
    inner_mask = create_circle_mask(image.shape, center, 0, inner_radius_px)
    middle_mask = create_circle_mask(
        image.shape, center, inner_radius_px, middle_radius_px
    )
    outer_mask = create_circle_mask(
        image.shape, center, middle_radius_px, outer_radius_px
    )

    # 分析每个圈的颜色
    result = {}

    for circle_name, mask in [
        ("inner", inner_mask),
        ("middle", middle_mask),
        ("outer", outer_mask),
    ]:
        # 提取主色调
        colors = extract_dominant_colors(image, mask, k=5)

        # 计算五行分布
        five_elements = calculate_five_element_distribution(image, mask)

        # 确定主导颜色和五行
        dominant_color = colors[0]["hex"] if colors else "#000000"
        dominant_element = get_dominant_element(five_elements)
        segmented_blocks = _extract_segmented_blocks(
            image,
            mask,
            circle_name=circle_name,
        )

        result[circle_name] = {
            "colors": colors,
            "five_elements": five_elements,
            "dominant_color": dominant_color,
            "dominant_element": dominant_element,
            "segmented_blocks": segmented_blocks,
        }

    return result


def analyze_circle_colors(
    image_path: str,
    three_circles_config: Optional[Dict[str, float]] = None,
) -> ThreeCircleColorResult:
    """
    分析三圈颜色（高级接口）

    Args:
        image_path: 图像文件路径
        three_circles_config: 三圈配置，包含 inner_radius 和 middle_radius
            默认为 {"inner_radius": 0.33, "middle_radius": 0.66}

    Returns:
        ThreeCircleColorResult: 三圈颜色分析结果
    """
    # 默认配置
    if three_circles_config is None:
        three_circles_config = {"inner_radius": 0.33, "middle_radius": 0.66}

    inner_radius = three_circles_config.get("inner_radius", 0.33)
    middle_radius = three_circles_config.get("middle_radius", 0.66)

    # 确保半径在有效范围内
    inner_radius = max(0.1, min(0.9, inner_radius))
    middle_radius = max(inner_radius + 0.1, min(0.95, middle_radius))

    # 提取颜色
    result_dict = extract_colors_by_circles(image_path, inner_radius, middle_radius)

    # 转换为数据类
    inner_data = CircleColorData(
        colors=result_dict["inner"]["colors"],
        five_elements=result_dict["inner"]["five_elements"],
        dominant_color=result_dict["inner"]["dominant_color"],
        dominant_element=result_dict["inner"]["dominant_element"],
    )

    middle_data = CircleColorData(
        colors=result_dict["middle"]["colors"],
        five_elements=result_dict["middle"]["five_elements"],
        dominant_color=result_dict["middle"]["dominant_color"],
        dominant_element=result_dict["middle"]["dominant_element"],
    )

    outer_data = CircleColorData(
        colors=result_dict["outer"]["colors"],
        five_elements=result_dict["outer"]["five_elements"],
        dominant_color=result_dict["outer"]["dominant_color"],
        dominant_element=result_dict["outer"]["dominant_element"],
    )

    return ThreeCircleColorResult(
        inner=inner_data,
        middle=middle_data,
        outer=outer_data,
    )


def generate_color_preview(
    image_path: str,
    inner_radius: float,
    middle_radius: float,
    output_path: Optional[str] = None,
) -> np.ndarray:
    """
    生成颜色分析预览图

    Args:
        image_path: 图像文件路径
        inner_radius: 内圈半径比例
        middle_radius: 中圈半径比例
        output_path: 输出路径（可选）

    Returns:
        np.ndarray: 预览图像
    """
    # 读取图像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"无法读取图像: {image_path}")

    # 确保图像是正方形
    h, w = image.shape[:2]
    if h != w:
        size = min(h, w)
        start_y = (h - size) // 2
        start_x = (w - size) // 2
        image = image[start_y : start_y + size, start_x : start_x + size]
        h = w = size

    # 创建预览图
    preview = image.copy()
    center = (w // 2, h // 2)
    max_radius = w // 2

    # 绘制三圈边界
    inner_radius_px = int(inner_radius * max_radius)
    middle_radius_px = int(middle_radius * max_radius)

    # 内圈（蓝色）
    cv2.circle(preview, center, inner_radius_px, (255, 100, 100), 2, cv2.LINE_AA)
    # 中圈（绿色）
    cv2.circle(preview, center, middle_radius_px, (100, 255, 100), 2, cv2.LINE_AA)
    # 外圈（红色）
    cv2.circle(preview, center, max_radius - 2, (100, 100, 255), 2, cv2.LINE_AA)

    # 添加标签
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 1

    # 内圈标签
    cv2.putText(
        preview,
        "Inner",
        (center[0] - 20, center[1] - inner_radius_px + 20),
        font,
        font_scale,
        (255, 100, 100),
        thickness,
    )
    # 中圈标签
    mid_label_y = center[1] - (inner_radius_px + middle_radius_px) // 2
    cv2.putText(
        preview,
        "Middle",
        (center[0] - 25, mid_label_y),
        font,
        font_scale,
        (100, 255, 100),
        thickness,
    )
    # 外圈标签
    outer_label_y = center[1] - (middle_radius_px + max_radius) // 2
    cv2.putText(
        preview,
        "Outer",
        (center[0] - 22, outer_label_y),
        font,
        font_scale,
        (100, 100, 255),
        thickness,
    )

    # 保存（如果需要）
    if output_path:
        cv2.imwrite(output_path, preview)

    return preview


# ============ 便捷函数 ============


def quick_extract(
    image_path: str,
    inner_radius: float = 0.33,
    middle_radius: float = 0.66,
) -> Dict[str, Any]:
    """
    快速提取三圈颜色

    Args:
        image_path: 图像文件路径
        inner_radius: 内圈半径比例（默认0.33）
        middle_radius: 中圈半径比例（默认0.66）

    Returns:
        Dict: 三圈颜色分析结果
    """
    return extract_colors_by_circles(image_path, inner_radius, middle_radius)


if __name__ == "__main__":
    # 测试代码
    import sys

    # 测试图像路径
    test_images = [
        "../../../artwork/010.jpeg",
        "../../../artwork/011.jpeg",
        "../../../artwork/001.JPG",
    ]

    # 查找第一个存在的测试图像
    test_image = None
    for img in test_images:
        if os.path.exists(img):
            test_image = img
            break

    if test_image is None:
        print("错误: 未找到测试图像")
        sys.exit(1)

    print(f"测试图像: {test_image}")
    print("-" * 50)

    # 测试三圈颜色提取
    try:
        result = extract_colors_by_circles(
            test_image,
            inner_radius=0.33,
            middle_radius=0.66,
        )

        print("\n三圈颜色分析结果:")
        print("=" * 50)

        for circle_name in ["inner", "middle", "outer"]:
            circle_data = result[circle_name]
            print(f"\n{circle_name.upper()} CIRCLE:")
            print(f"  主导五行: {circle_data['dominant_element']}")
            print(f"  主导颜色: {circle_data['dominant_color']}")
            print(f"  五行分布: {circle_data['five_elements']}")
            print("  主色调:")
            for color in circle_data["colors"][:3]:  # 只显示前3个
                print(f"    - {color['hex']} ({color['percentage']}%)")

        # 生成预览图
        preview = generate_color_preview(
            test_image,
            inner_radius=0.33,
            middle_radius=0.66,
            output_path="test_color_preview.jpg",
        )
        print("\n预览图已保存: test_color_preview.jpg")

    except Exception as e:
        print(f"测试失败: {e}")
        import traceback

        traceback.print_exc()
