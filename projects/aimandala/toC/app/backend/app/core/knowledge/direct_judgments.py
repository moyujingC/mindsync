"""
直断特征 - 快速识别关键心理特征
基于画面整体特征的直接判断
"""

DIRECT_JUDGMENTS = {
    "颜色浅、轻": {
        "pattern": "涂色清淡、下笔轻柔，整体泛白、色调浅淡无力",
        "meaning": "心力不足，状态低迷，缺乏力量",
        "detail": "行动力薄弱，习惯性拖延、躺平；精神易内耗，身体易湿气重；多伴随父子关系疏远、家中母亲强势",
        "principle": "浅淡色调代表能量不足，精神气力匮乏，缺乏进取动力",
        "suggestion": "先从恢复气力和行动节奏入手，再进入更深层的逐圈验证。",
        "severity": "中",
    },
    "颜色浓郁、深重": {
        "pattern": "涂色厚重、颜色深浓，画面大面积涂满无留白",
        "meaning": "情绪紧绷，欲望强烈，焦虑恐惧",
        "detail": "进取心充足，执念较重；容易急躁、紧张、焦虑，伴随恐惧情绪，思虑过重、内耗明显",
        "principle": "色彩厚重代表能量压抑、情绪张力强，负面情绪堆积",
        "suggestion": "先识别压力和情绪堆积，再结合逐圈证据确认具体卡点。",
        "severity": "高",
    },
    "整张大面积留白": {
        "pattern": "整张画作留白占比多、均匀留白",
        "meaning": "沉默内敛，表达欲薄弱",
        "detail": "对外界表达欲望低，感知力偏弱；多因过往表达不被看见，内心存有保留与失望",
        "principle": "空白区域代表能量闭塞，自我防御、不愿对外展露内心",
        "suggestion": "先寻找安全表达空间，再逐步恢复与外界的连接。",
        "severity": "中",
    },
    "外圈颜色单一且面积大": {
        "pattern": "外圈仅有单一颜色，色块占比面积偏大",
        "meaning": "务实偏物质，思维固化，成长有卡点",
        "detail": "偏重现实有形层面，求财专注赚钱、注重性价比；重视肉身健康养护。对意识、能量、智慧等无形维度感知偏弱，思维死板，个人成长容易受限卡点。",
        "principle": "五行失衡：单一颜色面积过大，打破五行平衡，形成个人能量卡点；单色代表能量聚焦且偏执。",
        "suggestion": "继续检查外圈对应的现实行动与物质层面是否过度单一。",
        "severity": "中",
    },
    "大面积黄色": {
        "pattern": "画面黄色面积占比大、黄色为主色调",
        "meaning": "温暖利他，思虑过重、操心内耗",
        "detail": "性格温和阳光，擅长照顾、包容他人；习惯性把精力耗费在他人身上，心思过重、多虑敏感，容易精神操心内耗。",
        "principle": "五行原理：黄色属土，土主思虑；土气过盛则执念多虑、墨守成规，难以跳出固有模式。",
        "suggestion": "继续检查土气是否在某一圈过盛，以及是否压住行动或表达。",
        "severity": "中",
    },
    "外圈花边、星星点点": {
        "pattern": "外圈存在花边、圆点、细碎小图案，五颜六色、零碎繁杂，外观精致好看",
        "meaning": "漏财，留不住钱财，为过手财神",
        "detail": "无论是否临摹画册自带线条，保留外圈细碎图案即为财富漏洞；画主爱美打扮、看重面子，钱财易经手流出",
        "principle": "解读看逻辑，图案缺口、细碎代表财富存不住；可主动画满规整外圈规避",
        "suggestion": "继续检查外圈财富与行动层是否存在零碎消耗。",
        "severity": "中",
    },
    "外圈红色多": {
        "pattern": "曼陀罗外圈大面积成片红色（相邻为绿色除外）",
        "meaning": "存在明显财富漏洞，钱财外泄，入不敷出",
        "detail": "消费无性价比，凭喜好购物；花钱爽快，不愿货比三家；习惯性为情绪买单；性格热情奔放，钱财易消耗",
        "principle": "五行原理：红色属火，火性发散燃烧、消耗外泄；外圈为物质圈，火在外圈代表钱财流失",
        "suggestion": "继续检查外圈行动和消费模式是否存在明显外泄。",
        "severity": "中",
    },
    "渐变色": {
        "pattern": "画面出现色彩渐变效果",
        "meaning": "处于转变、调整、试探改变阶段",
        "detail": "里圈或中圈渐变，提示内心想改变、犹豫不决、想法未落地；外圈渐变，提示已在现实中试探性做出调整",
        "principle": "渐变代表过渡、流动，对应人的状态变化与心理摇摆",
        "suggestion": "继续检查渐变发生在哪一圈，以判断变化停留在内在还是已进入现实行动。",
        "severity": "中",
    },
    "蓝绿搭配": {
        "pattern": "画面明显同时出现蓝色+绿色",
        "meaning": "擅长表达共情，开口来财",
        "detail": "性格通透，愿意敞开自我、与人分享，具备优秀语言表达力、共情力，容易凭借口才创收",
        "principle": "能量原理：蓝色对应喉轮，绿色对应心轮，双轮通畅利于人际表达",
        "suggestion": "继续检查表达能力如何落到主题中的现实机会。",
        "severity": "积极",
    },
    "内外同色": {
        "pattern": "内圈和外圈的颜色完全一致",
        "meaning": "为人坦荡，表里如一",
        "detail": "内心想法与外在行为统一，待人真诚直白，无城府、不虚伪",
        "principle": "圈层色彩统一，代表身心合一、心性纯粹",
        "suggestion": "继续检查中圈是否支持这种内外一致的表达。",
        "severity": "积极",
    },
    "外白内浓（心门关闭）": {
        "pattern": "外圈留白多，但里圈或中圈涂色3种以上",
        "meaning": "心门关闭，外冷内热",
        "detail": "自身想法丰富、内心思绪繁杂，但对外界态度冷淡、缺乏热情，刻意封闭自我",
        "principle": "内外反差明显，存在社交防备心理，不愿主动亲近他人",
        "suggestion": "继续检查外圈防御和内中圈丰富度之间的落差。",
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
