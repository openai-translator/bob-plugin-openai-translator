export interface SseMessage {
  event: string | null;
  data: string;
  raw: string[];
}

export class SseDecoder {
  private data: string[] = [];
  private event: string | null = null;
  private chunks: string[] = [];

  decode(line: string): SseMessage | null {
    // Remove trailing \r if present
    if (line.endsWith('\r')) {
      line = line.substring(0, line.length - 1);
    }

    // Empty line signals end of SSE message
    if (!line) {
      if (!this.event && !this.data.length) return null;

      const sse: SseMessage = {
        event: this.event,
        data: this.data.join('\n'),
        raw: this.chunks,
      };

      this.event = null;
      this.data = [];
      this.chunks = [];

      return sse;
    }

    this.chunks.push(line);

    // Comments start with ':'
    if (line.startsWith(':')) {
      return null;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      // Line without colon, treat entire line as field name
      return null;
    }

    const fieldname = line.substring(0, colonIndex);
    let value = line.substring(colonIndex + 1);

    // Remove leading space from value
    if (value.startsWith(' ')) {
      value = value.substring(1);
    }

    if (fieldname === 'event') {
      this.event = value;
    } else if (fieldname === 'data') {
      this.data.push(value);
    }

    return null;
  }
}

export class LineDecoder {
  private buffer = '';

  decode(chunk: string): string[] {
    const lines: string[] = [];
    this.buffer += chunk;

    while (true) {
      const newlineIndex = this.buffer.indexOf('\n');
      if (newlineIndex === -1) break;

      const line = this.buffer.slice(0, newlineIndex);
      lines.push(line);
      this.buffer = this.buffer.slice(newlineIndex + 1);
    }

    return lines;
  }

  flush(): string[] {
    if (!this.buffer) return [];
    const remainder = this.buffer;
    this.buffer = '';
    return [remainder];
  }
}
