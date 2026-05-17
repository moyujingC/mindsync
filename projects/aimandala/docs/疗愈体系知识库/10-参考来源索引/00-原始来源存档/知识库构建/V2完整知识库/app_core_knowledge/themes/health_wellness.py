"""
身体健康主题特化知识库

包含完整的主题配置、颜色解读、相生相克关系和疗愈方案
"""

from typing import Dict

# 主题配置
THEME_CONFIG = {
    "theme_id": "health_wellness",
    "theme_name_cn": "身体健康",
    "core_issues": ["身心连接与觉察", "情绪与身体症状", "自我照顾与忽视", "平衡与失衡"],
    "element_meanings": {
        "木": {
            "core_concept": "生命力与身体活力",
            "keywords": ["生长", "活力", "柔韧", "舒展"],
            "psychological_theme": "生命力的流动与身体活力",
        },
        "火": {
            "core_concept": "情绪健康与心理状态",
            "keywords": ["喜悦", "热情", "兴奋", "平衡"],
            "psychological_theme": "情绪平衡与心理健康",
        },
        "土": {
            "core_concept": "身体的滋养与消化",
            "keywords": ["滋养", "消化", "吸收", "稳定"],
            "psychological_theme": "身体基础与自我滋养",
        },
        "金": {
            "core_concept": "身体边界与免疫防御",
            "keywords": ["防御", "净化", "呼吸", "界限"],
            "psychological_theme": "身体边界与自我保护",
        },
        "水": {
            "core_concept": "深层生命力与恢复力",
            "keywords": ["恢复", "再生", "深度", "流动"],
            "psychological_theme": "深层恢复与生命韧性",
        },
    },
    "healing_template": {
        "duration_days": 30,
        "phases": [
            {
                "phase": 1,
                "days": "1-10",
                "theme": "觉察身心连接",
                "color": "绿色",
                "frequency": "每天7张",
            },
            {
                "phase": 2,
                "days": "11-20",
                "theme": "释放身体情绪",
                "color": "蓝色+黑色",
                "frequency": "每天7-14张",
            },
            {
                "phase": 3,
                "days": "21-30",
                "theme": "建立身心平衡",
                "color": "黄色+绿色",
                "frequency": "每天3-7张",
            },
        ],
    },
}

# 颜色解读
COLOR_MEANINGS = {
    "木": {
        "shades": {
            "深绿": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年时期生命力旺盛，但可能伴随压抑或过度的独立需求，导致肝气郁结",
                        "manifestations": [
                            "易怒",
                            "偏头痛",
                            "颈肩僵硬",
                            "过度追求完美",
                        ],
                        "healing_direction": "学习情绪表达，释放内在压抑，通过艺术或运动疏导",
                    },
                    "middle": {
                        "interpretation": "当下情绪波动大，易怒或压抑，肝胆功能受影响，身体僵硬",
                        "manifestations": [
                            "经常感到烦躁",
                            "胸闷",
                            "偏头痛",
                            "容易与人发生冲突",
                        ],
                        "healing_direction": "学习情绪觉察与表达，通过运动、冥想或芳疗疏导肝气",
                    },
                    "outer": {
                        "interpretation": "外在表现出强烈的独立性和决断力，但可能过于强势，导致人际关系紧张",
                        "manifestations": [
                            "工作上冲劲十足",
                            "易与同事冲突",
                            "身体出现肝胆问题",
                        ],
                        "healing_direction": "学习柔和沟通，平衡事业与生活，通过运动释放压力",
                    },
                }
            },
            "中绿": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年时期生命力流动平衡，具备一定的独立性和成长空间",
                        "manifestations": [
                            "情绪相对稳定",
                            "有主见但不固执",
                            "身体柔韧度良好",
                        ],
                        "healing_direction": "保持情绪流动性，继续培养健康的自我表达",
                    },
                    "middle": {
                        "interpretation": "当下情绪流动良好，肝胆功能正常，具备适度的决断力",
                        "manifestations": [
                            "情绪稳定",
                            "能够合理表达需求",
                            "身体状态良好",
                        ],
                        "healing_direction": "维持身心平衡，适度运动保持活力",
                    },
                    "outer": {
                        "interpretation": "外在表现灵活独立，能够适应环境变化，人际关系良好",
                        "manifestations": ["工作效率适中", "能够协作", "身体状况良好"],
                        "healing_direction": "继续保持平衡的生活方式，关注身体信号",
                    },
                }
            },
            "淡绿": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年缺乏自由成长空间，或父母过度干预，导致生命力受限，缺乏决断力",
                        "manifestations": [
                            "缺乏主见",
                            "易疲劳",
                            "指甲脆弱",
                            "对未来感到迷茫",
                        ],
                        "healing_direction": "培养自我价值感，尝试新事物，多接触大自然，滋养肝胆",
                    },
                    "middle": {
                        "interpretation": "当下缺乏活力和决断力，对生活感到疲惫，筋骨酸软",
                        "manifestations": [
                            "精神不振",
                            "容易疲劳",
                            "决策困难",
                            "对未来感到迷茫",
                        ],
                        "healing_direction": "培养积极心态，多接触新鲜事物，适度运动，滋养肝胆",
                    },
                    "outer": {
                        "interpretation": "外在适应能力较弱，缺乏行动力，难以抓住机遇，身体能量不足",
                        "manifestations": [
                            "工作效率低下",
                            "缺乏晋升机会",
                            "经常感到疲惫",
                            "筋骨酸软",
                        ],
                        "healing_direction": "培养自信心，主动寻求机会，多参与团队活动，提升生命活力",
                    },
                }
            },
        }
    },
    "火": {
        "shades": {
            "深红": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年可能经历过过度刺激或情感爆发，内心充满激情但易失控，或心火旺盛",
                        "manifestations": [
                            "睡眠差",
                            "口舌生疮",
                            "心悸",
                            "情绪大起大落",
                        ],
                        "healing_direction": "学习情绪管理，避免过度兴奋，通过冥想或温和运动降心火",
                    },
                    "middle": {
                        "interpretation": "当下热情高涨但易冲动，心火旺盛，可能伴随炎症或心血管问题",
                        "manifestations": [
                            "易失眠",
                            "口干舌燥",
                            "心悸",
                            "情绪激动",
                            "易发脾气",
                        ],
                        "healing_direction": "学习冷静思考，避免过度劳累，多进行放松练习，清心降火",
                    },
                    "outer": {
                        "interpretation": "外在表现热情洋溢，但可能过于冲动，易受情绪影响，导致决策失误",
                        "manifestations": [
                            "社交活跃但易言语过激",
                            "身体出现炎症",
                            "心血管问题",
                        ],
                        "healing_direction": "学习冷静分析，控制情绪，避免过度消耗，培养内在平和",
                    },
                }
            },
            "中红": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年时期情绪表达适度，热情与稳定达到较好平衡",
                        "manifestations": ["情绪稳定", "睡眠质量良好", "充满活力"],
                        "healing_direction": "保持情绪平衡，继续培养健康的热情表达方式",
                    },
                    "middle": {
                        "interpretation": "当下情绪热情适度，心火平衡，身心状态良好",
                        "manifestations": ["情绪积极", "精力充沛", "人际关系和谐"],
                        "healing_direction": "维持当前状态，适度社交和运动",
                    },
                    "outer": {
                        "interpretation": "外在表现热情适度，能够建立良好的社交连接",
                        "manifestations": ["社交活跃", "表达适度", "身体状况良好"],
                        "healing_direction": "继续保持平衡的社交生活，关注身体需求",
                    },
                }
            },
            "淡红": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年缺乏温暖或情感支持，内心能量不足，对生活缺乏热情",
                        "manifestations": [
                            "畏寒",
                            "面色苍白",
                            "缺乏活力",
                            "对人际关系感到冷淡",
                        ],
                        "healing_direction": "培养内在热情，多参与社交活动，补充心气，如晒太阳、适度运动",
                    },
                    "middle": {
                        "interpretation": "当下缺乏热情和动力，心气不足，可能伴随循环不畅或情绪低落",
                        "manifestations": [
                            "畏寒",
                            "面色苍白",
                            "精神萎靡",
                            "对人际关系感到冷漠",
                        ],
                        "healing_direction": "培养内在温暖，多参与社交，适度运动，补充心气",
                    },
                    "outer": {
                        "interpretation": "外在表现缺乏活力和吸引力，难以建立深层连接，身体能量不足",
                        "manifestations": [
                            "社交圈子小",
                            "缺乏表现欲",
                            "身体畏寒",
                            "面色苍白",
                        ],
                        "healing_direction": "培养内在热情，主动参与社交，多进行户外活动，提升个人魅力",
                    },
                }
            },
        }
    },
    "土": {
        "shades": {
            "深黄": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年得到充分滋养和安全感，但可能过于依赖，或脾胃功能负担重",
                        "manifestations": [
                            "体重超标",
                            "消化不良",
                            "身体沉重",
                            "过度担忧他人",
                        ],
                        "healing_direction": "学习独立，减轻身体负担，调整饮食结构，培养自我边界",
                    },
                    "middle": {
                        "interpretation": "当下消化系统负担重，身体沉重，可能伴随过度担忧或固执",
                        "manifestations": [
                            "消化不良",
                            "腹胀",
                            "体重增加",
                            "过度关注他人需求而忽略自己",
                        ],
                        "healing_direction": "调整饮食结构，减轻脾胃负担，学习放松，培养自我关怀",
                    },
                    "outer": {
                        "interpretation": "外在表现稳重可靠，但可能过于固执，难以适应变化，身体负担重",
                        "manifestations": [
                            "工作稳定但缺乏创新",
                            "身体消化不良",
                            "体重增加",
                        ],
                        "healing_direction": "学习灵活变通，接受新观念，调整饮食，减轻身体负担",
                    },
                }
            },
            "中黄": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年时期得到适度的滋养，具备稳定的身体基础和安全感",
                        "manifestations": ["消化功能良好", "身体结实", "情绪稳定"],
                        "healing_direction": "继续保持健康的生活方式，维持身心平衡",
                    },
                    "middle": {
                        "interpretation": "当下脾胃功能正常，能量充足，能够稳定地应对生活",
                        "manifestations": ["消化良好", "精力充沛", "情绪稳定"],
                        "healing_direction": "维持良好的饮食习惯，适度运动",
                    },
                    "outer": {
                        "interpretation": "外在表现稳重可靠，能够适应变化，身体状态良好",
                        "manifestations": ["工作稳定", "适应力强", "身体状况良好"],
                        "healing_direction": "继续保持稳定的生活节奏，关注身体需求",
                    },
                }
            },
            "淡黄": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年缺乏稳定和安全感，或消化系统较弱，导致能量不足",
                        "manifestations": [
                            "面黄肌瘦",
                            "食欲不振",
                            "容易腹泻",
                            "感到自卑",
                            "缺乏支持",
                        ],
                        "healing_direction": "建立内在安全感，改善饮食习惯，多进行腹部按摩，滋养脾胃",
                    },
                    "middle": {
                        "interpretation": "当下能量不足，脾胃虚弱，可能伴随疲劳或缺乏安全感",
                        "manifestations": [
                            "食欲不振",
                            "容易腹泻",
                            "肌肉无力",
                            "感到焦虑",
                            "缺乏支持",
                        ],
                        "healing_direction": "改善饮食习惯，多进行腹部按摩，培养稳定情绪，滋养脾胃",
                    },
                    "outer": {
                        "interpretation": "外在表现缺乏安全感和支持，难以融入集体，身体能量不足",
                        "manifestations": [
                            "工作中缺乏自信",
                            "易受他人影响",
                            "身体虚弱",
                            "容易生病",
                        ],
                        "healing_direction": "建立内在支持系统，培养自信，改善饮食，增强身体基础",
                    },
                }
            },
        }
    },
    "金": {
        "shades": {
            "深白": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年可能受到严格管教，形成高标准和自律，但也可能过于自我批判",
                        "manifestations": [
                            "皮肤敏感",
                            "呼吸道问题",
                            "容易感冒",
                            "对自己和他人要求过高",
                        ],
                        "healing_direction": "学习接纳不完美，放松身心，多进行深呼吸练习，滋养肺部",
                    },
                    "middle": {
                        "interpretation": "当下对自我要求过高，免疫力可能受损，或伴随呼吸道问题",
                        "manifestations": [
                            "容易感冒",
                            "皮肤过敏",
                            "呼吸不畅",
                            "过度批判自己和他人",
                        ],
                        "healing_direction": "学习自我接纳，放松身心，多进行深呼吸练习，增强免疫力",
                    },
                    "outer": {
                        "interpretation": "外在表现严谨自律，但可能过于挑剔，导致人际关系紧张，免疫力受损",
                        "manifestations": [
                            "工作中追求完美",
                            "易与人产生摩擦",
                            "身体出现呼吸道问题",
                        ],
                        "healing_direction": "学习宽容和接纳，放松身心，多进行深呼吸，提升免疫力",
                    },
                }
            },
            "中白": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年时期形成适度的自律和标准，具备健康的免疫力基础",
                        "manifestations": ["免疫力正常", "呼吸顺畅", "皮肤健康"],
                        "healing_direction": "继续保持健康的生活习惯，适度放松",
                    },
                    "middle": {
                        "interpretation": "当下免疫力良好，呼吸系统健康，能够合理要求自己",
                        "manifestations": ["抵抗力强", "呼吸顺畅", "情绪稳定"],
                        "healing_direction": "维持当前健康状态，保持适度运动",
                    },
                    "outer": {
                        "interpretation": "外在表现严谨但不过分苛刻，人际关系和谐，身体状况良好",
                        "manifestations": ["工作有条理", "人际关系良好", "免疫力正常"],
                        "healing_direction": "继续保持平衡的生活方式，关注身心需求",
                    },
                }
            },
            "淡白": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年缺乏规则感或被过度放纵，导致自我约束力不足，或免疫力低下",
                        "manifestations": [
                            "容易过敏",
                            "皮肤干燥",
                            "抵抗力差",
                            "缺乏边界感",
                            "容易受影响",
                        ],
                        "healing_direction": "建立健康的生活习惯，培养自律，多进行户外运动，增强免疫力",
                    },
                    "middle": {
                        "interpretation": "当下免疫力低下，容易生病，或缺乏自律和边界感",
                        "manifestations": [
                            "抵抗力差",
                            "皮肤干燥",
                            "容易感染",
                            "缺乏主见",
                            "易受影响",
                        ],
                        "healing_direction": "建立健康作息，培养自律，多进行户外运动，增强肺气",
                    },
                    "outer": {
                        "interpretation": "外在表现缺乏规则感和自律，难以获得认可，免疫力低下",
                        "manifestations": [
                            "工作中缺乏条理",
                            "易犯错",
                            "身体抵抗力差",
                            "容易感染",
                        ],
                        "healing_direction": "建立健康习惯，培养自律，多进行户外运动，增强肺气",
                    },
                }
            },
        }
    },
    "水": {
        "shades": {
            "深蓝": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年可能经历过深层恐惧或创伤，内心敏感，直觉力强但易被情绪淹没",
                        "manifestations": [
                            "泌尿系统问题",
                            "腰膝酸软",
                            "性功能障碍",
                            "过度焦虑",
                            "逃避",
                        ],
                        "healing_direction": "面对深层恐惧，寻求专业支持，多进行放松练习，滋养肾精",
                    },
                    "middle": {
                        "interpretation": "当下深层恐惧或焦虑浮现，肾脏功能可能受影响，精力不足",
                        "manifestations": [
                            "泌尿系统问题",
                            "腰膝酸软",
                            "性功能下降",
                            "过度担忧",
                            "逃避现实",
                        ],
                        "healing_direction": "面对内在恐惧，寻求支持，多进行放松练习，滋养肾精",
                    },
                    "outer": {
                        "interpretation": "外在表现深沉内敛，但可能过于敏感，易受外界影响，精力不足",
                        "manifestations": [
                            "社交中易感到疲惫",
                            "逃避",
                            "身体出现泌尿系统问题",
                        ],
                        "healing_direction": "学习情绪管理，建立心理边界，多进行放松练习，滋养肾精",
                    },
                }
            },
            "中蓝": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年时期具备适度的情感深度和安全感，直觉力与稳定性平衡",
                        "manifestations": [
                            "精力充足",
                            "情绪深沉但稳定",
                            "身体状态良好",
                        ],
                        "healing_direction": "保持情感深度，培养健康的情绪表达方式",
                    },
                    "middle": {
                        "interpretation": "当下精力充沛，肾水平衡，能够适度应对深层情绪",
                        "manifestations": ["精力良好", "情绪稳定", "身体功能正常"],
                        "healing_direction": "维持身心平衡，适度休息和放松",
                    },
                    "outer": {
                        "interpretation": "外在表现沉稳内敛，能够建立深层连接，身体状态良好",
                        "manifestations": ["社交适度", "有深度", "身体状况良好"],
                        "healing_direction": "继续保持平衡，关注深层身心需求",
                    },
                }
            },
            "淡蓝": {
                "three_circles": {
                    "inner": {
                        "interpretation": "童年缺乏情感连接或安全感，导致内心空虚，缺乏生命活力",
                        "manifestations": [
                            "记忆力下降",
                            "耳鸣",
                            "脱发",
                            "感到孤独",
                            "缺乏动力",
                        ],
                        "healing_direction": "培养内在力量，多进行冥想，补充水分，滋养肾水",
                    },
                    "middle": {
                        "interpretation": "当下缺乏生命活力和动力，肾水不足，可能伴随情绪低落",
                        "manifestations": [
                            "记忆力下降",
                            "耳鸣",
                            "脱发",
                            "感到孤独",
                            "缺乏生活目标",
                        ],
                        "healing_direction": "培养内在力量，多进行冥想，补充水分，滋养肾水",
                    },
                    "outer": {
                        "interpretation": "外在表现缺乏活力和动力，难以适应环境变化，身体能量不足",
                        "manifestations": [
                            "工作中缺乏激情",
                            "易感到倦怠",
                            "身体记忆力下降",
                            "耳鸣",
                        ],
                        "healing_direction": "培养内在力量，主动寻求支持，多进行冥想，提升生命活力",
                    },
                }
            },
        }
    },
}

# 相生相克关系
INTERACTIONS = {
    "generating": {
        "木生火": {
            "theme_meaning": "肝气疏泄，心火得养，情绪通畅，生命热情得以表达",
            "balanced_state": {
                "physical": "情绪稳定，心胸开阔，充满活力，睡眠质量好",
                "psychological": "能够健康地表达情绪，保持生命热情",
            },
            "imbalanced_state": {
                "physical": "肝郁化火，心烦意乱，失眠多梦，易怒，血压升高",
                "psychological": "情绪压抑转化为愤怒，影响心身健康",
            },
        },
        "火生土": {
            "theme_meaning": "心火温煦脾胃，消化功能旺盛，能量充足，身体强健",
            "balanced_state": {
                "physical": "消化良好，气血充足，面色红润，精力充沛",
                "psychological": "情绪稳定支持身体消化吸收",
            },
            "imbalanced_state": {
                "physical": "心火过旺，灼伤脾胃，口干舌燥，食欲不振，消瘦",
                "psychological": "过度兴奋消耗身体能量，影响消化",
            },
        },
        "土生金": {
            "theme_meaning": "脾胃运化精微，滋养肺气，免疫力强，呼吸顺畅",
            "balanced_state": {
                "physical": "免疫力强，不易感冒，皮肤光泽，呼吸深长有力",
                "psychological": "身体基础稳固支持自我保护能力",
            },
            "imbalanced_state": {
                "physical": "脾虚生湿，困阻肺气，咳嗽痰多，胸闷气短，乏力",
                "psychological": "思虑过重影响呼吸和免疫功能",
            },
        },
        "金生水": {
            "theme_meaning": "肺气肃降，通调水道，肾水得养，精力充沛，排毒顺畅",
            "balanced_state": {
                "physical": "呼吸顺畅，小便通利，精力旺盛，皮肤滋润",
                "psychological": "良好的排毒功能支持深层恢复",
            },
            "imbalanced_state": {
                "physical": "肺气不足，水液代谢失常，水肿，小便不利，精神萎靡",
                "psychological": "自我约束不足影响身体排毒和恢复",
            },
        },
        "水生木": {
            "theme_meaning": "肾水滋养肝木，肝气条达，筋骨强健，情绪平和",
            "balanced_state": {
                "physical": "筋骨柔韧，眼睛明亮，情绪稳定，睡眠安稳",
                "psychological": "深层生命力支持情绪流动和活力",
            },
            "imbalanced_state": {
                "physical": "肾水不足，肝阳上亢，头晕目眩，耳鸣，腰膝酸软",
                "psychological": "深层恐惧影响生命力和决断力",
            },
        },
    },
    "restraining": {
        "木克土": {
            "theme_meaning": "肝气疏泄，制约脾胃，防止湿气内生，保持消化平衡",
            "balanced_state": {
                "physical": "消化功能正常，身体轻盈，情绪稳定，不易腹胀",
                "psychological": "适度的决断力支持身体消化吸收",
            },
            "imbalanced_state": {
                "physical": "肝气犯脾，腹胀腹泻，食欲不振，情绪低落，消化不良",
                "psychological": "情绪压抑或愤怒影响消化功能",
            },
        },
        "土克水": {
            "theme_meaning": "脾土制约肾水，防止水湿泛滥，保持水液代谢平衡",
            "balanced_state": {
                "physical": "水液代谢正常，小便通利，身体无水肿，精力充沛",
                "psychological": "稳定的身体基础支持深层情绪",
            },
            "imbalanced_state": {
                "physical": "脾虚水泛，水肿，小便不利，腰膝酸软，精神萎靡",
                "psychological": "过度担忧影响深层生命力和恢复",
            },
        },
        "水克火": {
            "theme_meaning": "肾水制约心火，防止心火过旺，保持心肾相交",
            "balanced_state": {
                "physical": "心肾相交，睡眠安稳，情绪平和，精力充沛",
                "psychological": "深层安全感支持情绪平衡",
            },
            "imbalanced_state": {
                "physical": "肾水不足，心火亢盛，失眠多梦，心烦意乱，潮热盗汗",
                "psychological": "深层恐惧导致情绪失控和睡眠问题",
            },
        },
        "火克金": {
            "theme_meaning": "心火制约肺金，防止肺气过盛，保持呼吸顺畅",
            "balanced_state": {
                "physical": "呼吸平稳，免疫力正常，皮肤健康，不易感冒",
                "psychological": "适度的热情支持自我保护",
            },
            "imbalanced_state": {
                "physical": "心火灼肺，咳嗽痰黄，胸闷气短，口干舌燥，发热",
                "psychological": "过度兴奋消耗免疫力和身体防御",
            },
        },
        "金克木": {
            "theme_meaning": "肺金制约肝木，防止肝气过盛，保持情绪平和",
            "balanced_state": {
                "physical": "情绪稳定，筋骨柔韧，呼吸顺畅，不易发怒",
                "psychological": "适度的自律支持情绪流动",
            },
            "imbalanced_state": {
                "physical": "肺气不足，肝气郁结，胸胁胀痛，情绪低落，消化不良",
                "psychological": "过度自我批判导致情绪压抑",
            },
        },
    },
}

# 6个洞察角度模板 (Lite版 & Pro版共用)
INSIGHT_TEMPLATES = {
    "你的底色": {
        "角度": "整体生命能量状态",
        "示例": "你的画显示水元素深厚，显示你有很强的直觉力和生命潜能，但可能长期透支精力...",
    },
    "你的矛盾": {
        "角度": "内在能量 vs 外在消耗",
        "示例": "内圈的深度与外部的活跃显示，你可能在用外在的忙碌逃避内在的疲惫信号...",
    },
    "你的模式": {
        "角度": "情绪-身体的反应模式",
        "示例": "水克火的能量格局显示，你的情绪压抑可能正在影响睡眠质量和心脏功能...",
    },
    "你的防御": {
        "角度": "身体如何替你承载压力",
        "示例": "外圈的僵硬显示：当情绪无法表达时，你的身体通过紧绷和僵硬来'持有'这些能量...",
    },
    "你的卡点": {
        "角度": "需要关注的身心健康信号",
        "示例": "长期的情绪压抑与承载能力不足之间的冲突可能影响脾胃功能，表现为消化问题或体重波动...",
    },
    "你的光": {
        "角度": "身体的自愈潜力",
        "示例": "画显示你有极强的生命自愈力——当你开始倾听身体的信号而非忽视它，恢复会比想象中快...",
    },
}

# 失衡类型差异化解读 (10种 toC 可诊断类型)
IMBALANCE_MAPPINGS = {
    "水多木漂": {
        "核心矛盾": "养生知识多但实践少",
        "具体表现": "知道很多养生方法，但生活作息混乱",
        "转变方向": "减少知识收集，从一个小习惯开始",
    },
    "火多土焦": {
        "核心矛盾": "急躁消耗脾胃",
        "具体表现": "饮食不规律，爱吃辛辣食物，脾胃功能差",
        "转变方向": "规律饮食，细嚼慢咽",
    },
    "木多火塞": {
        "核心矛盾": "情绪压抑肝火旺",
        "具体表现": "有情绪但压抑，容易肝气郁结，易怒",
        "转变方向": "学习情绪表达，适当发泄",
    },
    "土多金埋": {
        "核心矛盾": "过度进补阻碍代谢",
        "具体表现": "过度进补或饮食过重，身体代谢负担大",
        "转变方向": "清淡饮食，减轻负担",
    },
    "金多水浊": {
        "核心矛盾": "过度思考伤肾",
        "具体表现": "思虑过度，影响睡眠和肾脏功能",
        "转变方向": "放下思虑，睡前放松",
    },
    "水多火灭": {
        "核心矛盾": "恐惧压制活力",
        "具体表现": "过度担心健康，反而影响身体机能",
        "转变方向": "信任身体，减少过度关注",
    },
    "火多金熔": {
        "核心矛盾": "运动过度消耗肺气",
        "具体表现": "运动过度或不科学，损伤呼吸系统",
        "转变方向": "适度运动，听从身体",
    },
    "金多木折": {
        "核心矛盾": "自我批评伤肝胆",
        "具体表现": "对自己过于苛刻，影响肝胆功能",
        "转变方向": "自我接纳，减少批评",
    },
    "木多土陷": {
        "核心矛盾": "过度成长消耗脾胃",
        "具体表现": "学习或工作过度，消耗脾胃能量",
        "转变方向": "劳逸结合，滋养脾胃",
    },
    "土多水干": {
        "核心矛盾": "固执阻碍疗愈",
        "具体表现": "固守不健康习惯，不愿改变生活方式",
        "转变方向": "开放心态，尝试新方法",
    },
}

# 疗愈方案
HEALING_PRESCRIPTIONS = {
    "issue_types": {
        "情绪压抑": {
            "symptoms": ["长期胸闷", "叹气", "易怒", "偏头痛", "无故哭泣"],
            "mandala_prescription": {
                "primary_colors": ["绿色", "青色"],
                "accent_colors": ["红色"],
                "purpose": "疏肝解郁，提升生命活力",
            },
            "daily_practice": ["每日深呼吸练习10分钟", "听舒缓音乐", "多接触大自然"],
            "cognitive_upgrade": "认识到情绪是身体的信号，允许自己感受和表达，而非压抑",
        },
        "能量耗竭": {
            "symptoms": ["长期疲劳", "精神不振", "食欲不佳", "面色萎黄"],
            "mandala_prescription": {
                "primary_colors": ["黄色", "橙色"],
                "accent_colors": ["红色"],
                "purpose": "滋养脾胃，提升能量",
            },
            "daily_practice": ["每日腹部按摩5分钟", "午后小憩", "饮食清淡", "规律作息"],
            "cognitive_upgrade": "认识到身体是能量的载体，学会自我滋养和休息，而非过度消耗",
        },
        "焦虑失眠": {
            "symptoms": ["心悸", "入睡困难", "多梦", "口干舌燥", "情绪烦躁"],
            "mandala_prescription": {
                "primary_colors": ["蓝色", "紫色"],
                "accent_colors": ["白色"],
                "purpose": "安抚心神，滋养肾水",
            },
            "daily_practice": [
                "睡前泡脚",
                "听冥想引导",
                "避免睡前使用电子产品",
                "保持卧室黑暗",
            ],
            "cognitive_upgrade": "认识到焦虑源于对未来的担忧，学会活在当下，信任生命进程",
        },
        "免疫力低下": {
            "symptoms": ["频繁感冒", "过敏", "皮肤问题", "呼吸道感染"],
            "mandala_prescription": {
                "primary_colors": ["白色", "金色"],
                "accent_colors": ["黄色"],
                "purpose": "增强肺气，提升免疫力",
            },
            "daily_practice": [
                "每日户外散步30分钟",
                "深呼吸",
                "保持室内空气流通",
                "补充维生素C",
            ],
            "cognitive_upgrade": "认识到身体有自愈能力，通过健康生活方式支持免疫系统",
        },
        "身体僵硬": {
            "symptoms": ["颈肩腰背酸痛", "筋骨不适", "身体活动受限"],
            "mandala_prescription": {
                "primary_colors": ["绿色", "蓝色"],
                "accent_colors": ["黑色"],
                "purpose": "柔韧筋骨，滋养肾精",
            },
            "daily_practice": ["每日拉伸、瑜伽或太极练习", "温水泡澡", "避免久坐"],
            "cognitive_upgrade": "认识到身体是流动的，学会放松和释放身体的紧张",
        },
        "深层恐惧": {
            "symptoms": ["莫名的不安", "逃避", "缺乏安全感", "泌尿系统问题"],
            "mandala_prescription": {
                "primary_colors": ["黑色", "深蓝色"],
                "accent_colors": ["白色"],
                "purpose": "面对恐惧，净化身心",
            },
            "daily_practice": ["每日冥想", "写日记", "寻求心理咨询", "多进行放松练习"],
            "cognitive_upgrade": "认识到恐惧是成长的机会，勇敢面对内在阴影，转化负面能量",
        },
    }
}


def get_config() -> Dict:
    """获取主题配置"""
    return THEME_CONFIG


def get_color_meanings() -> Dict:
    """获取颜色解读数据"""
    return COLOR_MEANINGS


def get_interactions() -> Dict:
    """获取相生相克关系数据"""
    return INTERACTIONS


def get_healing_prescriptions() -> Dict:
    """获取疗愈方案数据"""
    return HEALING_PRESCRIPTIONS


def get_insight_templates() -> Dict:
    """获取6个洞察角度模板"""
    return INSIGHT_TEMPLATES


def get_imbalance_mappings() -> Dict:
    """获取失衡类型差异化解读映射"""
    return IMBALANCE_MAPPINGS


def get_experiment_template() -> str:
    """获取实验建议模板"""
    return """
💡 一个小实验
这周每天安排10分钟"身体扫描"：
闭上眼睛，从头顶到脚底，
留意哪个部位有紧绷或不适，
只是觉察，不评判，
把手放在那个位置，深呼吸三次。
"""


def get_pro_upgrade_teaser() -> str:
    """获取Pro版引导文案"""
    return """
🔓 还有6个深层洞察...
包括：
- 身心症状的深层情绪根源
- 五行调理的具体方案
- 针对你画面能量的21天身心疗愈方案

👉 解锁完整版
"""
