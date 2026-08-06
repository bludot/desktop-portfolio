/**
 * Arithmetic in the launcher.
 *
 * Parsed rather than evaluated. `eval` on whatever somebody types is the one
 * thing this must not do — the query arrives from a text field and could just
 * as easily arrive from a URL one day, and "it is only my own site" is exactly
 * the reasoning behind most of the interesting bugs. A recursive-descent parser
 * over a fixed grammar can only ever produce a number, so there is nothing to
 * be careful about.
 *
 * The grammar, loosest to tightest:
 *
 *   expression := term (("+" | "-") term)*
 *   term       := power (("*" | "/" | "%") power)*
 *   power      := unary ("^" power)?          -- right-associative
 *   unary      := ("-" | "+") unary | primary
 *   primary    := number | constant | name "(" args ")" | "(" expression ")"
 */

/** What a name stands for. Constants only; nothing here reaches the page. */
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E
};

/** The functions worth having in a launcher, and no more. */
const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  log: Math.log10,
  ln: Math.log,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  min: Math.min,
  max: Math.max
};

type Token =
  | { kind: "number"; value: number }
  | { kind: "name"; value: string }
  | { kind: "op"; value: string };

function tokenise(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const start = i;
      while (i < input.length && /[0-9.]/.test(input[i])) i += 1;
      const text = input.slice(start, i);
      // "1.2.3" tokenises as one run of digits and dots, and is not a number.
      if ((text.match(/\./g) ?? []).length > 1) return null;
      const value = Number(text);
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: "number", value });
      continue;
    }

    if (/[a-z]/i.test(char)) {
      const start = i;
      while (i < input.length && /[a-z]/i.test(input[i])) i += 1;
      tokens.push({ kind: "name", value: input.slice(start, i).toLowerCase() });
      continue;
    }

    if ("+-*/%^(),".includes(char)) {
      tokens.push({ kind: "op", value: char });
      i += 1;
      continue;
    }

    // Anything else is not arithmetic, and this is not an error worth
    // reporting — it just means the query was prose.
    return null;
  }

  return tokens;
}

class Parser {
  private tokens: Token[];
  private at = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.at];
  }

  private eat(value: string): boolean {
    const token = this.peek();
    if (token && token.kind === "op" && token.value === value) {
      this.at += 1;
      return true;
    }
    return false;
  }

  done(): boolean {
    return this.at >= this.tokens.length;
  }

  expression(): number {
    let left = this.term();
    for (;;) {
      if (this.eat("+")) left += this.term();
      else if (this.eat("-")) left -= this.term();
      else return left;
    }
  }

  private term(): number {
    let left = this.power();
    for (;;) {
      if (this.eat("*")) left *= this.power();
      else if (this.eat("/")) left /= this.power();
      else if (this.eat("%")) left %= this.power();
      else return left;
    }
  }

  private power(): number {
    const base = this.unary();
    // Right-associative: 2^3^2 is 2^(3^2), as it is written on paper.
    if (this.eat("^")) return Math.pow(base, this.power());
    return base;
  }

  private unary(): number {
    if (this.eat("-")) return -this.unary();
    if (this.eat("+")) return this.unary();
    return this.primary();
  }

  private primary(): number {
    const token = this.peek();
    if (!token) throw new Error("unexpected end");

    if (token.kind === "number") {
      this.at += 1;
      return token.value;
    }

    if (token.kind === "name") {
      this.at += 1;
      const name = token.value;

      if (this.eat("(")) {
        const args: number[] = [];
        if (!this.eat(")")) {
          do {
            args.push(this.expression());
          } while (this.eat(","));
          if (!this.eat(")")) throw new Error("unclosed call");
        }
        const fn = FUNCTIONS[name];
        if (!fn) throw new Error("unknown function");
        return fn(...args);
      }

      if (name in CONSTANTS) return CONSTANTS[name];
      throw new Error("unknown name");
    }

    if (this.eat("(")) {
      const value = this.expression();
      if (!this.eat(")")) throw new Error("unclosed group");
      return value;
    }

    throw new Error("unexpected token");
  }
}

/**
 * The answer, or null when the query was not a sum.
 *
 * Null covers every kind of "no": prose, a half-typed expression, a name that
 * means nothing, and a result that is not a finite number. A launcher asks this
 * of everything anybody types, so failing has to be ordinary and quiet.
 */
export function calculate(query: string): number | null {
  const text = query.trim().replace(/=+$/, "").trim();
  if (!text) return null;

  // A bare number is not a calculation, and answering "12" with "= 12" is
  // noise in a list where "12" might be the name of something.
  if (!/[+\-*/%^()]/.test(text)) return null;
  // Nor is a lone operator, or the "-" in a repository name.
  if (!/[0-9]|pi|\be\b/i.test(text)) return null;

  const tokens = tokenise(text);
  if (!tokens || !tokens.length) return null;

  try {
    const parser = new Parser(tokens);
    const value = parser.expression();
    if (!parser.done()) return null;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * The answer as it should be read.
 *
 * Long decimals are the common case — a third of anything — so the tail is
 * trimmed rather than printed in full, and trailing zeroes go with it. Very
 * large and very small numbers keep exponent form, where rounding would print
 * a wall of zeroes that is not the answer.
 */
export function formatAnswer(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) {
    return value.toLocaleString("en-US");
  }
  const magnitude = Math.abs(value);
  if (magnitude !== 0 && (magnitude >= 1e15 || magnitude < 1e-6)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  return String(Number(value.toFixed(10)));
}
