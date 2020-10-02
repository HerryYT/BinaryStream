import Buffer from "https://deno.land/std@0.71.0/node/buffer.ts";

export default class BinaryStream {
  protected buffer: Buffer;
  protected offset: number;

  constructor(buffer: Buffer = Buffer.alloc(0), offset: number = 0) {
    this.buffer = buffer;
    this.offset = offset;
  }

  public read(bytes: number): Buffer {
    return this.buffer.slice(0, this.addOffset(bytes));
  }

  public write(bytes: Uint8Array | Buffer): void {
    this.buffer = Buffer.concat([this.buffer, bytes]);
  }

  public readByte(): number {
    return this.buffer[this.addOffset(1)];
  }

  public writeByte(v: number): void {
    this.write(Buffer.from([v & 0xFF]));
  }

  public readBool(): boolean {
    return this.readByte() !== 0;
  }

  public writeBool(v: boolean): void {
    this.writeByte(v ? 1 : 0);
  }

  public readShort(): number {
    return this.buffer.readUInt16BE(this.addOffset(2));
  }

  public writeShort(v: number): void {
    this.writeByte((v >> 8) & 0xff);
    this.writeByte(v & 0xff);
  }

  public readLShort(): number {
    return this.buffer.writeUInt16LE(this.addOffset(2));
  }

  public writeLShort(v: number): void {
    this.writeByte(v & 0xff);
    this.writeByte((v >> 8) & 0xff);
  }

  public readTriad(): number {
    return this.readIntBE(this.buffer, this.addOffset(3), 3);
  }

  public writeTriad(v: number): void {
    let buffer = Buffer.alloc(3);
    this.writeIntBE(buffer, v, 0, 3);
    this.write(buffer);
  }

  public readInt(): number {
    return this.buffer.readInt32BE(this.addOffset(4));
  }

  public writeInt(v: number): void {
    let buffer = Buffer.alloc(4);
    buffer.writeInt32BE(v);
    this.write(buffer);
  }

  public readLInt(): number {
    return this.buffer.readInt32LE(this.addOffset(4));
  }

  public writeLInt(v: number): void {
    let buffer = Buffer.alloc(4);
    buffer.writeInt32LE(v);
    this.write(buffer);
  }

  // TODO: check offset validity
  private readUIntLE(buffer: Buffer, offset: number, byteLength: number): number {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    let i: number = 0,
      mul: number = 1,
      val: number = buffer[offset];
      
    while (++i < byteLength && (mul *= 0x100)) {
      val += buffer[offset + i] * mul;
    }

    return val;
  }

  private writeUIntLE(buffer: Buffer, value: number, offset: number, byteLength: number): void {
    value = +value;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    let i: number = 0,
      mul: number = 1;

    buffer[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      buffer[offset + i] = (value / mul) & 0xFF;
    }
  }

  private readIntLE(buffer: Buffer, offset: number, byteLength: number): number {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    let i: number = 0,
      mul: number = 1,
      val: number = buffer[offset];

    while (++i < byteLength && (mul *= 0x100)) {
      val += buffer[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val;
  }

  private writeIntLE(buffer: Buffer, value: number, offset: number, byteLength: number): void {
    value = +value;
    offset = offset >>> 0;

    let i: number = 0,
      mul: number = 1,
      sub: number = 0;

    buffer[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && buffer[offset + i] !== 0) {
        sub = 1;
      }
      buffer[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }
  }

  private readUIntBE(buffer: Buffer, offset: number, byteLength: number): number {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    let val: number = buffer[offset + --byteLength],
      mul: number = 1;

    while (byteLength > 0 && (mul *= 0x100)) {
      val += buffer[offset + --byteLength] * mul;
    }

    return val;
  }

  private writeUIntBE(buffer: Buffer, value: number, offset: number, byteLength: number): void {
    value = +value;
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    let i: number = byteLength - 1,
      mul: number = 1;

    buffer[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      buffer[offset + i] = (value / mul) & 0xFF;
    }
  }

  private readIntBE(buffer: Buffer, offset: number, byteLength: number): number {
    offset = offset >>> 0;
    byteLength = byteLength >>> 0;

    let i: number = byteLength,
      mul: number = 1,
      val: number = buffer[offset + --i];

    while (i > 0 && (mul *= 0x100)) {
      val += buffer[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val;
  }

  private writeIntBE(buffer: Buffer, value: number, offset: number, byteLength: number): void {
    value = +value;
    offset = offset >>> 0;

    let i: number = byteLength - 1,
      mul: number = 1,
      sub: number = 0;
    
    buffer[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && buffer[offset + i + 1] !== 0) {
        sub = 1;
      }
      buffer[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }
  }

  protected addOffset(len: number, ret: boolean = false) {
    return ret ? this.offset += len : (this.offset += len) - len;
  }

  public getBuffer() {
    return this.buffer;
  }
}
