export const themeDisplayNames: Record<string, string> = {
  wealth: "财富关系",
  general: "全面解读",
  father_relationship: "父亲关系",
  mother_relationship: "母亲关系",
  intimate_relationship: "亲密关系",
  parent_child_relationship: "亲子关系",
  wealth_career: "事业发展",
  career_development: "事业发展",
  body_health: "身体健康",
  health_body: "身体健康",
  health_wellness: "身体健康",
  personal_growth: "个人成长",
};

export function normalizeThemeId(theme?: string | null): string | null {
  if (typeof theme !== "string") {
    return null;
  }

  const normalized = theme.trim().toLowerCase();
  return normalized || null;
}

export function getThemeDisplayName(
  theme?: string | null,
  options: {
    generalLabel?: string | null;
    fallbackToOriginal?: boolean;
  } = {},
): string | null {
  const normalized = normalizeThemeId(theme);
  const generalLabel = options.generalLabel === undefined
    ? themeDisplayNames.general
    : options.generalLabel;
  const fallbackToOriginal = options.fallbackToOriginal ?? true;

  if (!normalized || normalized === "general") {
    return generalLabel;
  }

  if (normalized in themeDisplayNames) {
    return themeDisplayNames[normalized];
  }

  if (!fallbackToOriginal || typeof theme !== "string") {
    return null;
  }

  const original = theme.trim();
  return original || null;
}

export function isKnownThemeId(theme?: string | null): boolean {
  const normalized = normalizeThemeId(theme);
  return Boolean(normalized && normalized in themeDisplayNames);
}
