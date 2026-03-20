#!/bin/bash

# DBusメディアプレイヤーモニタリングスクリプト
# Ubuntu/Debianでの一般的な実装

# DBusを使用して一般的なメディアプレイヤーの情報を取得
get_media_info() {
    local media_info
    local artist
    local title
    local album
    local duration
    local position
    local playback_status
    local artwork
    local timestamp

    # Spotifyを優先的にチェック
    if playerctl -l 2>/dev/null | grep -q spotify; then
        media_info=$(playerctl -p spotify metadata --format '{{artist}}\t{{title}}\t{{album}}\t{{duration(mpris:length)}}\t{{position(mpris:length)}}\t{{status}}\t{{mpris:artUrl}}' 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$media_info" ]; then
            IFS=$'\t' read -r artist title album duration position playback_status artwork <<< "$media_info"
            duration=$(echo "$duration" | awk -F: '{ print ($1 * 60) + $2 }')
            position=$(echo "$position" | awk -F: '{ print ($1 * 60) + $2 }')
            playback_status=$(echo "$playback_status" | awk '{ if ($1 == "Playing") print 1; else print 2 }')
            timestamp=$(date +%s)
            echo "JSON_START"
            jq -n \
                --arg artist "$artist" \
                --arg title "$title" \
                --arg album "$album" \
                --argjson duration "$duration" \
                --argjson position "$position" \
                --argjson playbackStatus "$playback_status" \
                --argjson timestamp "$timestamp" \
                --arg artworkBase64 "" \
                --arg artworkMIME "image/png" \
                '{artist: $artist, title: $title, album: $album, duration: $duration, position: $position, playbackStatus: $playbackStatus, timestamp: $timestamp, artworkBase64: $artworkBase64, artworkMIME: $artworkMIME}'
            echo "JSON_END"
            return 0
        fi
    fi

    # VLCやその他のプレイヤーをチェック
    if playerctl -l 2>/dev/null | grep -q vlc; then
        media_info=$(playerctl -p vlc metadata --format '{{artist}}\t{{title}}\t{{album}}\t{{duration(mpris:length)}}\t{{position(mpris:length)}}\t{{status}}' 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$media_info" ]; then
            IFS=$'\t' read -r artist title album duration position playback_status <<< "$media_info"
            duration=$(echo "$duration" | awk -F: '{ print ($1 * 60) + $2 }')
            position=$(echo "$position" | awk -F: '{ print ($1 * 60) + $2 }')
            playback_status=$(echo "$playback_status" | awk '{ if ($1 == "Playing") print 1; else print 2 }')
            timestamp=$(date +%s)
            echo "JSON_START"
            jq -n \
                --arg artist "$artist" \
                --arg title "$title" \
                --arg album "$album" \
                --argjson duration "$duration" \
                --argjson position "$position" \
                --argjson playbackStatus "$playback_status" \
                --argjson timestamp "$timestamp" \
                --arg artworkBase64 "" \
                --arg artworkMIME "image/png" \
                '{artist: $artist, title: $title, album: $album, duration: $duration, position: $position, playbackStatus: $playbackStatus, timestamp: $timestamp, artworkBase64: $artworkBase64, artworkMIME: $artworkMIME}'
            echo "JSON_END"
            return 0
        fi
    fi

    # FirefoxやChromeのWebメディアをチェック
    if playerctl -l 2>/dev/null | grep -q firefox; then
        media_info=$(playerctl -p firefox metadata --format '{{artist}}\t{{title}}\t{{album}}\t{{duration(mpris:length)}}\t{{position(mpris:length)}}\t{{status}}' 2>/dev/null)
        if [ $? -eq 0 ] && [ -n "$media_info" ]; then
            IFS=$'\t' read -r artist title album duration position playback_status <<< "$media_info"
            duration=$(echo "$duration" | awk -F: '{ print ($1 * 60) + $2 }')
            position=$(echo "$position" | awk -F: '{ print ($1 * 60) + $2 }')
            playback_status=$(echo "$playback_status" | awk '{ if ($1 == "Playing") print 1; else print 2 }')
            timestamp=$(date +%s)
            echo "JSON_START"
            jq -n \
                --arg artist "$artist" \
                --arg title "$title" \
                --arg album "$album" \
                --argjson duration "$duration" \
                --argjson position "$position" \
                --argjson playbackStatus "$playback_status" \
                --argjson timestamp "$timestamp" \
                --arg artworkBase64 "" \
                --arg artworkMIME "image/png" \
                '{artist: $artist, title: $title, album: $album, duration: $duration, position: $position, playbackStatus: $playbackStatus, timestamp: $timestamp, artworkBase64: $artworkBase64, artworkMIME: $artworkMIME}'
            echo "JSON_END"
            return 0
        fi
    fi

    # 標準メディアプレイヤーをチェック
    if playerctl metadata --format '{{artist}}\t{{title}}\t{{album}}\t{{duration(mpris:length)}}\t{{position(mpris:length)}}\t{{status}}' 2>/dev/null; then
        media_info=$(playerctl metadata --format '{{artist}}\t{{title}}\t{{album}}\t{{duration(mpris:length)}}\t{{position(mpris:length)}}\t{{status}}')
        IFS=$'\t' read -r artist title album duration position playback_status <<< "$media_info"
        duration=$(echo "$duration" | awk -F: '{ print ($1 * 60) + $2 }')
        position=$(echo "$position" | awk -F: '{ print ($1 * 60) + $2 }')
        playback_status=$(echo "$playback_status" | awk '{ if ($1 == "Playing") print 1; else print 2 }')
        timestamp=$(date +%s)
        echo "JSON_START"
        jq -n \
            --arg artist "$artist" \
            --arg title "$title" \
            --arg album "$album" \
            --argjson duration "$duration" \
            --argjson position "$position" \
            --argjson playbackStatus "$playback_status" \
            --argjson timestamp "$timestamp" \
            --arg artworkBase64 "" \
            --arg artworkMIME "image/png" \
            '{artist: $artist, title: $title, album: $album, duration: $duration, position: $position, playbackStatus: $playbackStatus, timestamp: $timestamp, artworkBase64: $artworkBase64, artworkMIME: $artworkMIME}'
        echo "JSON_END"
        return 0
    fi

    # 一切のプレイヤーが見つからない場合
    echo "JSON_START"
    jq -n '{artist: "", title: "", album: "", duration: 0, position: 0, playbackStatus: 2, timestamp: 0, artworkBase64: "", artworkMIME: "image/png"}'
    echo "JSON_END"
    return 0
}

# メディア制御呼び出し
control_media() {
    local action=$1
    local value=$2

    case $action in
        "play-pause")
            playerctl play-pause
            ;;
        "next")
            playerctl next
            ;;
        "prev")
            playerctl prev
            ;;
        "seek")
            if [ -n "$value" ]; then
                playerctl position $value
            fi
            ;;
    esac
}

# 当スクリプトがどのように呼ばれたかを確認
if [ $# -eq 0 ]; then
    # メディア情報取得を繰り返す
    while true; do
        get_media_info
        sleep 1
    done
else
    # メディア制御命令
    control_media "$1" "$2"
fi