import {useRef} from "react";
import usePictureInPicture from 'react-use-pip';
import ReactPlayer from "react-player";

function VideoPlayer() {
  const videoRef = useRef(null)

  return (
    <div className="App">
      <ReactPlayer ref={videoRef} url="tos-teaser.mp4">
      </ReactPlayer>
    </div>
  )
}
export default VideoPlayer;