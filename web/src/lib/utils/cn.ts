export type ClassValue = string | number | boolean | null | undefined;
export type ClassArray = ClassValue[];
export type ClassName = ClassValue | ClassArray;

export function cn(...inputs: ClassName[]): string {
  const classes: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    const type = typeof input;
    if (type === "string" || type === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      classes.push(cn(...input));
    } else if (input !== null && type === "object") {
      const record = input as unknown as Record<string, unknown>;
      for (const key in record) {
        if (record[key]) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}