"use client";

import { useEffect, useMemo, useState } from "react";

const NUMBER_TYPES = new Set([
  "INTEGER",
  "LONG",
  "DECIMAL",
  "DOUBLE",
  "PERCENTAGE",
  "CURRENCY",
]);

const PRIMITIVE_ARRAY_TYPES = new Set([
  "STRING",
  "INTEGER",
  "LONG",
  "DECIMAL",
  "DOUBLE",
  "BOOLEAN",
]);

function toNumber(raw) {
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function JsonEditor({ value, onChange, disabled, arrayOnly, locale }) {
  const [text, setText] = useState(() =>
    JSON.stringify(value ?? (arrayOnly ? [] : {}), null, 2),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setText(JSON.stringify(value ?? (arrayOnly ? [] : {}), null, 2));
  }, [value, arrayOnly]);

  const handleChange = (next) => {
    setText(next);
    try {
      const parsed = JSON.parse(next);
      if (arrayOnly && !Array.isArray(parsed)) {
        throw new Error(
          locale === "ar" ? "القيمة يجب أن تكون مصفوفة" : "Value must be an array",
        );
      }
      if (!arrayOnly && (parsed === null || typeof parsed !== "object")) {
        throw new Error(
          locale === "ar" ? "القيمة يجب أن تكون كائن JSON" : "Value must be a JSON object",
        );
      }
      setError("");
      onChange(parsed);
    } catch (parseError) {
      setError(parseError.message);
    }
  };

  return (
    <div className="space-y-1">
      <textarea
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        rows={arrayOnly ? 5 : 6}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-xs text-gray-800 outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function parseDuration(value) {
  if (typeof value !== "string" || !value) return { amount: "", unit: "M" };
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return { amount: "", unit: "M" };
  if (match[1]) return { amount: match[1], unit: "D" };
  if (match[2]) return { amount: match[2], unit: "H" };
  if (match[3]) return { amount: match[3], unit: "M" };
  if (match[4]) return { amount: match[4], unit: "S" };
  return { amount: "", unit: "M" };
}

function DurationEditor({ value, onChange, disabled, locale }) {
  const parsed = useMemo(() => parseDuration(value), [value]);
  const [amount, setAmount] = useState(parsed.amount);
  const [unit, setUnit] = useState(parsed.unit);

  useEffect(() => {
    setAmount(parsed.amount);
    setUnit(parsed.unit);
  }, [parsed.amount, parsed.unit]);

  const emit = (nextAmount, nextUnit) => {
    if (nextAmount === "") {
      onChange(null);
      return;
    }
    const numeric = Number(nextAmount);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return;
    }
    if (nextUnit === "D") {
      onChange(`P${numeric}D`);
    } else {
      onChange(`PT${numeric}${nextUnit}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        step="1"
        value={amount}
        disabled={disabled}
        onChange={(event) => {
          setAmount(event.target.value);
          emit(event.target.value, unit);
        }}
        className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
        aria-label={locale === "ar" ? "قيمة المدة" : "Duration amount"}
      />
      <select
        value={unit}
        disabled={disabled}
        onChange={(event) => {
          setUnit(event.target.value);
          emit(amount, event.target.value);
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      >
        <option value="S">{locale === "ar" ? "ثانية" : "Seconds"}</option>
        <option value="M">{locale === "ar" ? "دقيقة" : "Minutes"}</option>
        <option value="H">{locale === "ar" ? "ساعة" : "Hours"}</option>
        <option value="D">{locale === "ar" ? "يوم" : "Days"}</option>
      </select>
    </div>
  );
}

function ListEditor({ definition, value, onChange, disabled, locale }) {
  const elementType = definition.constraints?.elementType;
  const items = Array.isArray(value) ? value : [];
  const isNumeric = ["INTEGER", "LONG", "DECIMAL", "DOUBLE"].includes(elementType);

  const update = (index, nextValue) => {
    const copy = [...items];
    copy[index] = nextValue;
    onChange(copy);
  };

  const add = () => {
    onChange([...items, isNumeric ? 0 : ""]);
  };

  const remove = (index) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-gray-500">
          {locale === "ar" ? "لا توجد عناصر بعد." : "No items yet."}
        </p>
      ) : null}
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type={isNumeric ? "number" : "text"}
            step={elementType === "DECIMAL" || elementType === "DOUBLE" ? "0.01" : undefined}
            value={item ?? ""}
            disabled={disabled}
            onChange={(event) =>
              update(index, isNumeric ? toNumber(event.target.value) : event.target.value)
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => remove(index)}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {locale === "ar" ? "حذف" : "Remove"}
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={add}
        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {locale === "ar" ? "إضافة عنصر" : "Add item"}
      </button>
    </div>
  );
}

export default function SettingControl({
  definition,
  value,
  onChange,
  disabled = false,
  locale = "ar",
  hasStoredValue = false,
}) {
  const type = definition.type;
  const constraints = definition.constraints || {};
  const isSensitive = definition.sensitive;

  if (isSensitive) {
    return (
      <div className="space-y-1">
        <input
          type="password"
          autoComplete="new-password"
          value={value ?? ""}
          disabled={disabled}
          placeholder={
            hasStoredValue
              ? locale === "ar"
                ? "قيمة مخزنة ومخفية — أدخل قيمة جديدة للاستبدال"
                : "A stored value is hidden — enter a new value to replace it"
              : locale === "ar"
                ? "أدخل قيمة حساسة"
                : "Enter a sensitive value"
          }
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
        />
        <p className="text-xs text-amber-700">
          {locale === "ar"
            ? "القيمة لا تُعرض مرة أخرى بعد الحفظ، وتُحجب من سجل التغييرات."
            : "The value is never displayed again after saving and is redacted from the audit trail."}
        </p>
      </div>
    );
  }

  if (type === "BOOLEAN") {
    const checked = Boolean(value);
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#204272] focus-visible:ring-offset-2 disabled:opacity-50 ${
          checked ? "bg-[#204272]" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
        <span className="sr-only">
          {checked
            ? locale === "ar"
              ? "مفعّل"
              : "Enabled"
            : locale === "ar"
              ? "معطّل"
              : "Disabled"}
        </span>
      </button>
    );
  }

  if (type === "ENUM") {
    return (
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      >
        <option value="" disabled>
          {locale === "ar" ? "اختر قيمة" : "Select a value"}
        </option>
        {(definition.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {locale === "ar" ? option.labelAr || option.label : option.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === "JSON") {
    return (
      <JsonEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        locale={locale}
      />
    );
  }

  if (type === "ARRAY") {
    const elementType = constraints.elementType;
    if (elementType && PRIMITIVE_ARRAY_TYPES.has(elementType)) {
      return (
        <ListEditor
          definition={definition}
          value={value}
          onChange={onChange}
          disabled={disabled}
          locale={locale}
        />
      );
    }
    return (
      <JsonEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        arrayOnly
        locale={locale}
      />
    );
  }

  if (type === "DURATION") {
    return (
      <DurationEditor
        value={value}
        onChange={onChange}
        disabled={disabled}
        locale={locale}
      />
    );
  }

  if (type === "DATE") {
    return (
      <input
        type="date"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      />
    );
  }

  if (type === "DATETIME") {
    return (
      <input
        type="datetime-local"
        value={value ? String(value).slice(0, 16) : ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      />
    );
  }

  if (type === "URL" || type === "EMAIL" || type === "STRING") {
    if (type === "STRING" && constraints.multiline) {
      return (
        <textarea
          value={value ?? ""}
          disabled={disabled}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
        />
      );
    }
    return (
      <input
        type={type === "URL" ? "url" : type === "EMAIL" ? "email" : "text"}
        value={value ?? ""}
        disabled={disabled}
        minLength={constraints.minLength ?? undefined}
        maxLength={constraints.maxLength ?? undefined}
        pattern={constraints.pattern ?? undefined}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      />
    );
  }

  if (NUMBER_TYPES.has(type)) {
    const step =
      type === "INTEGER" || type === "LONG"
        ? "1"
        : type === "PERCENTAGE"
          ? "0.01"
          : "0.01";
    return (
      <input
        type="number"
        step={step}
        min={constraints.min ?? (type === "PERCENTAGE" ? 0 : undefined)}
        max={constraints.max ?? (type === "PERCENTAGE" ? 100 : undefined)}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(toNumber(event.target.value))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#204272] focus:ring-2 focus:ring-[#204272]/20 disabled:bg-gray-100"
      />
    );
  }

  return (
    <JsonEditor
      value={value}
      onChange={onChange}
      disabled={disabled}
      locale={locale}
    />
  );
}
