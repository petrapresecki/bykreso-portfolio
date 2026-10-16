import AVFoundation
import AppKit
// barcode <in> <out.png> [columns]: one column per sampled frame (whole-frame average) for videos, one per pixel column for images
let input = URL(fileURLWithPath: CommandLine.arguments[1])
let out = URL(fileURLWithPath: CommandLine.arguments[2])
let cols = CommandLine.arguments.count > 3 ? Int(CommandLine.arguments[3])! : 240
func average(_ cg: CGImage, _ w: Int) -> [[UInt8]] {
  // Draw into w x 1 so the context averages each column for us
  var px = [UInt8](repeating: 0, count: w * 4)
  let ctx = CGContext(data: &px, width: w, height: 1, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.interpolationQuality = .medium
  ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: 1))
  return (0..<w).map { [px[$0*4], px[$0*4+1], px[$0*4+2]] }
}
var colors: [[UInt8]] = []
if input.pathExtension == "mp4" {
  let asset = AVURLAsset(url: input)
  let dur = CMTimeGetSeconds(asset.duration)
  let gen = AVAssetImageGenerator(asset: asset)
  gen.maximumSize = CGSize(width: 64, height: 64)
  gen.requestedTimeToleranceBefore = CMTime(seconds: 0.2, preferredTimescale: 600); gen.requestedTimeToleranceAfter = CMTime(seconds: 0.2, preferredTimescale: 600); gen.appliesPreferredTrackTransform = true
  for i in 0..<cols {
    let t = CMTime(seconds: dur * (Double(i) + 0.5) / Double(cols), preferredTimescale: 600)
    if let cg = try? gen.copyCGImage(at: t, actualTime: nil) { colors.append(average(cg, 1)[0]) } else if let last = colors.last { colors.append(last) }
  }
} else {
  let img = NSImage(contentsOf: input)!
  colors = average(img.cgImage(forProposedRect: nil, context: nil, hints: nil)!, cols)
}
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: colors.count, pixelsHigh: 1, bitsPerSample: 8, samplesPerPixel: 3, hasAlpha: false, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: colors.count * 3, bitsPerPixel: 24)!
for (x, c) in colors.enumerated() { rep.setColor(NSColor(deviceRed: CGFloat(c[0])/255, green: CGFloat(c[1])/255, blue: CGFloat(c[2])/255, alpha: 1), atX: x, y: 0) }
try! rep.representation(using: .png, properties: [:])!.write(to: out)
// Average of the whole film, for the page colour
let n = Double(colors.count)
let avg = (0..<3).map { k in Int(colors.reduce(0.0) { $0 + Double($1[k]) } / n) }
print(String(format: "#%02X%02X%02X", avg[0], avg[1], avg[2]))
