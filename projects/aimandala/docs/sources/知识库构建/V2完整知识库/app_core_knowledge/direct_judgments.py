"""
直断特征 - 快速识别关键心理特征
基于画面整体特征的直接判断
"""

DIRECT_JUDGMENTS = {
    "涂色很满深色为主": {
        "pattern": "画面整体涂得很满，深色为主",
        "meaning": "焦虑担忧的情绪，除了焦虑还有恐惧",
        "detail": "可能处于压力较大的状态，需要情绪释放的出口",
        "suggestion": "建议进行情绪疏导，找到安全的表达方式",
        "severity": "高",
    },
    "整体泛白颜色偏淡": {
        "pattern": "整体泛白，颜色偏淡",
        "meaning": "做事无力量感，喜欢躺平",
        "detail": "可能与父亲关系疏远，或母亲强势导致父亲没有力量",
        "suggestion": "重建自我价值感，找到内在动力源",
        "severity": "中",
    },
    "思虑过重喜好操心": {
        "pattern": "大面积黄色",
        "meaning": "思虑过重，喜好操心",
        "detail": "黄色代表'思'，生活中很照顾别人，像太阳一样温暖。但面积过大代表思虑过度，把心思放在别人身上",
        "suggestion": "学会平衡自我关怀与照顾他人",
        "severity": "中",
    },
    "喜欢分享开口来财": {
        "pattern": "明显有蓝色+绿色",
        "meaning": "喜欢分享，开口来财",
        "detail": "蓝色代表喉轮，绿色代表心轮，代表愿意敞开与他人分享，在优秀的表达力和共情力下更容易开口来财",
        "suggestion": "保持开放心态，善用沟通能力",
        "severity": "积极",
    },
    "入不敷出热情奔放": {
        "pattern": "外圈有成片红色（相邻色非绿色）",
        "meaning": "入不敷出，热情奔放",
        "detail": "曼陀罗外圈有一圈成片红色，红色属火，意味着燃烧，引申为入不敷出",
        "suggestion": "注意能量管理，平衡付出与收获",
        "severity": "中",
    },
    "关注外表过手财神": {
        "pattern": "外圈颜色五颜六色、零零碎碎、花边",
        "meaning": "关注外表，过手财神",
        "detail": "爱美、爱打扮、要面子，容易做'过手财神'（钱来得快去得也快）",
        "suggestion": "关注内在价值，建立健康的财富观",
        "severity": "中",
    },
    "表里如一": {
        "pattern": "内圈和外圈颜色完全一致",
        "meaning": "表里如一",
        "detail": "内外一致，真实坦诚，不伪装",
        "suggestion": "保持这份真实，同时学会适当保护自己",
        "severity": "积极",
    },
    "不想说啥无声沉默": {
        "pattern": "整张留白较多",
        "meaning": "不想说啥，无声沉默",
        "detail": "对于世界没有什么想要表达的东西，感知力较弱。或者曾经的表达不被看见后对这个世界有所保留或失望",
        "suggestion": "找到安全的表达方式，逐步重建表达信心",
        "severity": "中",
    },
    "心门关闭": {
        "pattern": "外圈留白多，但里圈或中圈涂的颜色3个以上",
        "meaning": "心门关闭",
        "detail": "对外界不热情，自己有想法，只是对外界有防备",
        "suggestion": "探索防备的原因，在安全的关系中尝试开放",
        "severity": "中",
    },
}


# 颜色深度判断规则
COLOR_DEPTH_RULES = {
    "深色": {
        "threshold": "颜色饱和度高，接近色卡深色区",
        "indicators": ["力量感强", "情绪浓烈", "可能压抑"],
    },
    "浅色": {
        "threshold": "颜色饱和度低，接近色卡浅色区",
        "indicators": ["力量感弱", "情绪柔和", "可能逃避"],
    },
    "混合": {
        "threshold": "深浅色都有",
        "indicators": ["情绪复杂", "内外不一致", "正在整合"],
    },
}


# 留白分析
WHITESPACE_ANALYSIS = {
    "大量留白": {
        "meaning": "保留空间，可能缺乏表达欲或对世界失望",
        "inner_meaning": "内在空虚或不愿面对",
        "outer_meaning": "对外在世界保持距离",
    },
    "少量留白": {
        "meaning": "充分表达，可能追求完美或焦虑",
        "inner_meaning": "内在丰富，自我要求高",
        "outer_meaning": "积极与外界互动",
    },
    "无留白": {
        "meaning": "完全填满，可能有控制欲或焦虑",
        "inner_meaning": "害怕空虚，需要填满一切",
        "outer_meaning": "想要掌控所有空间",
    },
}


def analyze_whitespace(whitespace_ratio: float) -> dict:
    """分析留白比例
    whitespace_ratio: 0-1之间的数值
    """
    if whitespace_ratio > 0.4:
        return {"level": "大量留白", **WHITESPACE_ANALYSIS["大量留白"]}
    elif whitespace_ratio > 0.15:
        return {"level": "适量留白", "meaning": "平衡状态，有表达也有空间"}
    elif whitespace_ratio > 0.05:
        return {"level": "少量留白", **WHITESPACE_ANALYSIS["少量留白"]}
    else:
        return {"level": "无留白", **WHITESPACE_ANALYSIS["无留白"]}


def match_direct_judgments(observed_features: list) -> list:
    """
    根据观察到的特征匹配直断
    observed_features: ["外圈成片红色", "大面积黄色"]
    """
    matched = []
    for key, judgment in DIRECT_JUDGMENTS.items():
        for feature in observed_features:
            if feature in judgment["pattern"] or judgment["pattern"] in feature:
                matched.append({"judgment_key": key, **judgment})
                break
    return matched
