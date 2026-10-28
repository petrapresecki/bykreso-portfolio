import AVFoundation
import AppKit
// preview <in.mp4> <out.mp4> <longSide> <start> <seconds> <kbps> [still.jpg]: a light, silent loop from the film for the
// strip (the player keeps the full film). With still.jpg, also writes its first frame at the same size.
let a = CommandLine.arguments
let input = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2])
let longSide = Double(a[3])!
let start = CMTime(seconds: Double(a[4])!, preferredTimescale: 600)
let seconds = Double(a[5])!
let kbps = Int(a[6])!
try? FileManager.default.removeItem(at: out)

let track = input.tracks(withMediaType: .video)[0]
let natural = track.naturalSize
let scale = min(1, longSide / max(natural.width, natural.height))
// H.264 wants even dimensions
let w = Int((natural.width * scale / 2).rounded()) * 2
let h = Int((natural.height * scale / 2).rounded()) * 2
let duration = min(seconds, CMTimeGetSeconds(input.duration) - CMTimeGetSeconds(start))

let reader = try! AVAssetReader(asset: input)
reader.timeRange = CMTimeRange(start: start, duration: CMTime(seconds: duration, preferredTimescale: 600))
let output = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
reader.add(output)

let writer = try! AVAssetWriter(outputURL: out, fileType: .mp4)
writer.shouldOptimizeForNetworkUse = true
let fps = max(1, Int(track.nominalFrameRate.rounded()))
let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: w,
  AVVideoHeightKey: h,
  AVVideoScalingModeKey: AVVideoScalingModeResizeAspectFill,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: kbps * 1000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: fps * 2,
    AVVideoAllowFrameReorderingKey: true,
  ],
]
let input2 = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input2.transform = track.preferredTransform
input2.expectsMediaDataInRealTime = false
writer.add(input2)

reader.startReading()
writer.startWriting()
writer.startSession(atSourceTime: start)
let done = DispatchSemaphore(value: 0)
input2.requestMediaDataWhenReady(on: DispatchQueue(label: "preview")) {
  while input2.isReadyForMoreMediaData {
    if let buf = output.copyNextSampleBuffer() {
      input2.append(buf)
    } else {
      input2.markAsFinished()
      writer.finishWriting { done.signal() }
      return
    }
  }
}
done.wait()
if writer.status != .completed { print("failed: \(writer.error?.localizedDescription ?? "?")"); exit(1) }

if a.count > 7 {
  let gen = AVAssetImageGenerator(asset: AVURLAsset(url: out))
  gen.appliesPreferredTrackTransform = true
  gen.requestedTimeToleranceBefore = .zero
  gen.requestedTimeToleranceAfter = .zero
  let cg = try! gen.copyCGImage(at: .zero, actualTime: nil)
  let jpg = NSBitmapImageRep(cgImage: cg).representation(using: .jpeg, properties: [.compressionFactor: 0.72])!
  try! jpg.write(to: URL(fileURLWithPath: a[7]))
}
let size = (try? FileManager.default.attributesOfItem(atPath: out.path)[.size] as? Int) ?? 0
print("\(out.lastPathComponent) \(w)x\(h) \(String(format: "%.1f", duration))s \(size / 1024)K")
