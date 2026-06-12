import { useState } from "react";
import { Pencil } from "lucide-react";

interface TextInputFieldProps {
  placeholder: string;
}

const MAX_LENGTH = 300;

export function TextInputField({ placeholder }: TextInputFieldProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="relative rounded-xl px-4 transition-all duration-200"
      style={{
        minHeight: focused ? "100px" : "48px",
        height: focused ? "auto" : "48px",
        border: focused
          ? "1.5px solid rgba(212, 160, 84, 0.45)"
          : "1px solid rgba(200, 120, 80, 0.15)",
        backgroundColor: focused ? "rgba(212, 160, 84, 0.03)" : "#F5EFE2",
        boxShadow: focused ? "0 0 0 3px rgba(212, 160, 84, 0.08)" : "none",
        display: "flex",
        flexDirection: focused ? "column" : "row",
        alignItems: focused ? "stretch" : "center",
        paddingTop: focused ? "12px" : "0",
        paddingBottom: focused ? "28px" : "0",
      }}
    >
      {focused ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= MAX_LENGTH) {
              setValue(e.target.value);
            }
          }}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          maxLength={MAX_LENGTH}
          className="flex-1 outline-none bg-transparent resize-none"
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "14px",
            color: "#3D2E1E",
            lineHeight: "1.6",
            minHeight: "60px",
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          readOnly
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="flex-1 outline-none bg-transparent"
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "14px",
            color: "#3D2E1E",
          }}
        />
      )}

      {focused ? (
        <span
          className="absolute"
          style={{
            right: "14px",
            bottom: "8px",
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "11px",
            color: "rgba(155, 122, 90, 0.5)",
          }}
        >
          {value.length}/{MAX_LENGTH}字
        </span>
      ) : (
        <Pencil
          size={16}
          color="rgba(200, 120, 80, 0.3)"
          className="ml-2 flex-shrink-0"
        />
      )}
    </div>
  );
}
