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
var hls = null;
var dash = null;
var setting = null;

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
  const [quality_array, setQualityArray] = useState([]);

  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);

  const togglePlay = () => {
    setState({...state, playing: !state.playing});
    // dash.setQualityFor("video", dash.getQualityFor("video") + 1, true);
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

  const changeQuality = (index) => {
    if(hls && hls.currentLevel !== index) hls.currentLevel = index;
    else if(dash && dash.getQualityFor("video") !== index) {
      dash.getSettings().streaming.abr.autoSwitchBitrate.video = false;
      dash.setQualityFor("video", index, false);
    }
  }

  const toggleFullScreen = () => {
    setState({
      ...state, fullScreen: !state.fullScreen
    });
    screenfull.toggle(containerRef.current);
  }

  const handleProgress = (progress) => {
    // console.log(dash.getQualityFor("video"));

    if(count > 3){
      controlsRef.current.style.visibility = "hidden";
      count = 0;
    }

    if(controlsRef.current.style.visibility == "visible") {
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
    ctx.drawImage(playerRef.current.gethls(), 0, 0, canvas.width, canvas.height); 

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

  const handleReady = () => {
    hls = playerRef.current.getInternalPlayer('hls');
    dash = playerRef.current.getInternalPlayer('dash');
    // console.log(playerRef.current.getInternalPlayer('dash'));
    
    if(hls){
      const level_array = hls.levels.map((one) => {
        return parseInt(one.attrs.RESOLUTION.split("x")[1]);
      });
      console.log(hls.firstLevel);
      setQualityArray(level_array);
      hls.autoLevelEnabled = true;
      hls.autoLevelCapping = -1;
    }

    if(dash) {
      setting = dash.getSettings();
      setting.streaming.abr.useDefaultABRRules = false;
      const level_array = dash.getTracksFor("video")[0].bitrateList.map((one) => {
        return parseInt(one.height);
      });
      setQualityArray(level_array);
      setting.streaming.bufferTimeAtTopQuality = 10;
      setting.streaming.bufferTimeAtTopQualityLongForm = 15;
      setting.streaming.stableBufferTime = 10;
      setting.streaming.fastSwitchEnabled = true;
      dash.updateSettings(setting);
      // dash.getSettings().streaming.fastSwitchEnabled = true;
    }
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
        // onMouseLeave={hanldeMouseLeave}
      >
        <div className="video-wrapper">
          <ReactPlayer
            ref={playerRef}
            width="inherit"
            height="inherit"
            // url="tos-teaser.mp4"
            url="http://localhost:80/upload/admin@admin/output/1634880037120_yt5s.mp4.mpd"
            controls={false}
            playing={state.playing}
            muted={state.muted}
            volume={state.volume}
            playbackRate={state.playbackRate}
            onReady={handleReady}
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
            changeQuality={changeQuality}
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
            quality_array={quality_array}
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