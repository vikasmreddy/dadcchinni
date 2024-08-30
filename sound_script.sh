for file in arjun.wav kieran.wav roshan.wav ro.wav; do
  # Analyze the loudness
  ffmpeg -i "$file" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB,loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json" -f null - > "${file%.wav}_loudnorm.json"
  
  # Hardcoded values for testing
  measured_I="-16"
  measured_LRA="11"
  measured_TP="-1.5"
  measured_thresh="-70"
  
  # Debug output
  echo "Processing $file"
  echo "measured_I: $measured_I"
  echo "measured_LRA: $measured_LRA"
  echo "measured_TP: $measured_TP"
  echo "measured_thresh: $measured_thresh"
  
  # Apply the normalization and trimming
  ffmpeg -i "$file" -af "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB,loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$measured_I:measured_LRA=$measured_LRA:measured_TP=$measured_TP:measured_thresh=$measured_thresh,atempo=2.0" -t 5 "trimmed_${file%.wav}.wav"
done
