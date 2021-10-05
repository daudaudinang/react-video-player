import './App.css';
import {useState, useEffect, useRef} from 'react';
import ReactPlayer from "react-player";
import PlayerControls from './components/PlayerControls';
import screenfull from 'screenfull';
import {Paper, Grid, Typography} from "@mui/material";

const format = (seconds) => {
  if(isNaN(seconds)) {
    return '00:00';
  }

  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getUTCSeconds().toString().padStart(2,"0");
  if(hh){
    return `${hh}:${mm.toString().padStart(2,"0")}:${ss}`
  }

  return `${mm}:${ss}`;
}

let count = 0;

function App() {
  const [state, setState] = useState({
    playing: false,
    muted: true,
    volume: 0.5,
    playbackRate: 1.0,
    fullScreen: false,
    seeking: false,
    played: 0
  });

  const [timeDisplayFormat, setTimeDisplayFormat] = useState("normal");
  const [bookmarks, setBookmarks] = useState([]);
  const [activePip, setActivePip] = useState(false);

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);

  const togglePlay = () => {
    setState({...state, playing: !state.playing});
  }

  const handleRewind = () => {
    playerRef.current.seekTo(playerRef.current.getCurrentTime() - 5, 'seconds');
  }

  const handleForward = () => {
    playerRef.current.seekTo(playerRef.current.getCurrentTime() + 5, 'seconds');
  }

  const toggleMute = () => {
    setState({
      ...state, muted: !state.muted
    })
  }

  const changeVolume = (event) => {
    setState({
      ...state, volume: Number(event.target.value) / 100, muted: event.target.value === 0 ? true : false
    })
  }

  const changePlaybackRate = (rate) => {
    setState({
      ...state, playbackRate: Number(rate)
    })
  }

  const toggleFullScreen = () => {
    setState({
      ...state, fullScreen: !state.fullScreen
    });
    screenfull.toggle(containerRef.current);
  }

  const handleProgress = (progress) => {
    if(count > 3){
      controlsRef.current.style.visibility = "hidden";
      count = 0;
    }

    if(controlsRef.current.style.visibility == "visible") {
      console.log(count);
      count = count + 1;
    }

    if(!state.seeking) {
      setState({
        ...state, played: progress.played
      });
    }
  }

  const handleSeekMouseDown = (e) => {
    setState({
      ...state, seeking: true
    })
  }

  const handleSeekMouseUp = (e, newValue) => {
    setState({
      ...state, seeking: false, played: parseFloat(newValue / 100)
    });
    playerRef.current.seekTo(newValue/100);
  }

  const handleChangeDisplayFormat = () => {
    setTimeDisplayFormat(
      timeDisplayFormat==='normal'? 'remaining' : 'normal'
    );
  }

  const addBookmark = () => {
    const canvas = canvasRef.current;
    canvas.width = 160;
    canvas.height = 90;

    const ctx = canvas.getContext("2d");

    // Cần tìm hiểu thêm:
    ctx.drawImage(playerRef.current.getInternalPlayer(), 0, 0, canvas.width, canvas.height); 

    const imageUrl = canvas.toDataURL();
    canvas.width = 0;
    canvas.height = 0;
    setBookmarks([
      ...bookmarks,
      {time: currentTime, display: elapsedTime, image: imageUrl}
    ])
  }

  const handleEnded = () => {
    setState({...state, playing: false})
  }

  const handleMouseMove = () => {
    controlsRef.current.style.visibility = "visible";
    count = 0;
  };

  const toggleActivePip = () => {
    setActivePip(!activePip);
  }

  const currentTime = playerRef.current ? playerRef.current.getCurrentTime() : "00:00";
  const duration = playerRef.current ? playerRef.current.getDuration() : "00:00";
  
  const elapsedTime = timeDisplayFormat === "normal" ? format(currentTime) : `-${format(duration - currentTime)}`;
  const totalDuration = format(duration);

  return (
    <div className="main-container">
      <div 
        ref={containerRef} 
        className="video-container"
        onMouseMove={handleMouseMove}
        onClick={togglePlay}
        // onMouseLeave={hanldeMouseLeave}
      >
        <div className="video-wrapper">
          <ReactPlayer
            ref={playerRef}
            width="inherit"
            height="inherit"
            // url="tos-teaser.mp4"
            url="https://bitmovin-a.akamaihd.net/content/MI201109210084_1/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd"
            controls={false}
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            playbackRate={state.playbackRate}
            onProgress={handleProgress}
            onEnded={handleEnded}
            pip={activePip}
            stopOnUnmount={true}
          >
          </ReactPlayer>
          <PlayerControls  
            ref={controlsRef}
            togglePlay={togglePlay}
            playing={state.playing}
            handleRewind={handleRewind}
            handleForward={handleForward}
            muted={state.muted}
            toggleMute={toggleMute}
            volume={state.volume}
            changeVolume={changeVolume}
            playbackRate={state.playbackRate}
            changePlaybackRate={changePlaybackRate}
            fullScreen={state.fullScreen}
            toggleFullScreen={toggleFullScreen}
            played={state.played}
            onSeekMouseDown={handleSeekMouseDown}
            onSeekMouseUp={handleSeekMouseUp}
            elapsedTime={elapsedTime}
            totalDuration={totalDuration}
            onChangeDisplayFormat={handleChangeDisplayFormat}
            addBookmark={addBookmark}
            toggleActivePip={toggleActivePip}
            activePip={activePip}
          />
        </div>
      </div>
        <Grid container style={{marginTop:20, cursor: "pointer"}} className="bookmarks" spacing={3}>
          {bookmarks.map((bookmark, index) => 
            <Grid onClick={() => playerRef.current.seekTo(bookmark.time)} item key={index}>
              <Paper>
                <img crossOrigin="anomyous" src={bookmark.image} />
                <Typography>
                  Bookmark at {format(bookmark.time)}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>

        <canvas ref={canvasRef} />
    </div>
  );
}

export default App;