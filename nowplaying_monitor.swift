import Foundation

// Define the necessary parts of MediaRemote
let lib = dlopen("/System/Library/PrivateFrameworks/MediaRemote.framework/MediaRemote", RTLD_NOW)

typealias MRMediaRemoteGetNowPlayingInfoFunction = @convention(c) (DispatchQueue, @escaping ([String: Any]) -> Void) -> Void
let MRMediaRemoteGetNowPlayingInfo = unsafeBitCast(dlsym(lib, "MRMediaRemoteGetNowPlayingInfo"), to: MRMediaRemoteGetNowPlayingInfoFunction.self)

typealias MRMediaRemoteGetNowPlayingApplicationPlaybackStateFunction = @convention(c) (DispatchQueue, @escaping (UInt32) -> Void) -> Void
let MRMediaRemoteGetNowPlayingApplicationPlaybackState = unsafeBitCast(dlsym(lib, "MRMediaRemoteGetNowPlayingApplicationPlaybackState"), to: MRMediaRemoteGetNowPlayingApplicationPlaybackStateFunction.self)

typealias MRMediaRemoteSendCommandFunction = @convention(c) (UInt32, Any?) -> Bool
let MRMediaRemoteSendCommand = unsafeBitCast(dlsym(lib, "MRMediaRemoteSendCommand"), to: MRMediaRemoteSendCommandFunction.self)

typealias MRMediaRemoteSetElapsedTimeFunction = @convention(c) (Double) -> Bool
let MRMediaRemoteSetElapsedTime = unsafeBitCast(dlsym(lib, "MRMediaRemoteSetElapsedTime"), to: MRMediaRemoteSetElapsedTimeFunction.self)

let args = CommandLine.arguments

if args.count > 1 {
    let command = args[1]
    var success = false
    
    switch command {
    case "play-pause":
        success = MRMediaRemoteSendCommand(2, nil) // kMRTogglePlayPause = 2
    case "next":
        success = MRMediaRemoteSendCommand(4, nil) // kMRNextTrack = 4
    case "prev":
        success = MRMediaRemoteSendCommand(5, nil) // kMRPreviousTrack = 5
    case "seek":
        if args.count > 2, let time = Double(args[2]) {
            success = MRMediaRemoteSetElapsedTime(time)
        }
    default:
        break
    }
    
    print("{\"success\": \(success)}")
    exit(0)
}

// Get Info Mode
let semaphore = DispatchSemaphore(value: 0)
var result: [String: Any] = [:]
let queue = DispatchQueue(label: "media-remote-queue")

MRMediaRemoteGetNowPlayingInfo(queue) { info in
    // Extract metadata safely
    result["title"] = info["kMRMediaRemoteNowPlayingInfoTitle"] as? String ?? ""
    result["artist"] = info["kMRMediaRemoteNowPlayingInfoArtist"] as? String ?? ""
    result["album"] = info["kMRMediaRemoteNowPlayingInfoAlbum"] as? String ?? ""
    result["duration"] = info["kMRMediaRemoteNowPlayingInfoDuration"] as? Double ?? 0.0
    result["elapsedTime"] = info["kMRMediaRemoteNowPlayingInfoElapsedTime"] as? Double ?? 0.0
    result["timestamp"] = (info["kMRMediaRemoteNowPlayingInfoTimestamp"] as? Date)?.timeIntervalSince1970 ?? Date().timeIntervalSince1970
    
    if let artworkData = info["kMRMediaRemoteNowPlayingInfoArtworkData"] as? Data {
        result["artworkBase64"] = artworkData.base64EncodedString()
        result["artworkMIME"] = info["kMRMediaRemoteNowPlayingInfoArtworkMIMEType"] as? String ?? "image/png"
    } else {
        result["artworkBase64"] = ""
    }
    
    MRMediaRemoteGetNowPlayingApplicationPlaybackState(queue) { state in
        result["playbackState"] = Int(state)
        semaphore.signal()
    }
}

let timeoutResult = semaphore.wait(timeout: .now() + 2.0)
if timeoutResult == .timedOut {
    print("{}")
} else {
    if let jsonData = try? JSONSerialization.data(withJSONObject: result, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
        print("JSON_START")
        print(jsonString)
        print("JSON_END")
    } else {
        print("{}")
    }
}
