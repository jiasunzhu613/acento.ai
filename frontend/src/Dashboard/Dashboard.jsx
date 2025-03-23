import "./Dashboard.css";
import "./../index.css";
import { useEffect, useState, useRef } from "react";
import {
  getUserChats,
  getUserMessages,
  startNewChatFromAudio,
} from "../services/firestore";
import { useAuth } from "../services/AuthContext";
import DashboardChat from "../DashboardChat/DashboardChat";

function Dashboard() {
  const constraints = { audio: true };
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  // use later
  let mediaRecorder;
  let recordedChunks;
  const audioRef = useRef();
  const audioInputRef = useRef();
  const [feedback, setFeedback] = useState("");

  function handleDataAvailable(event) {
    console.log("handleDataAvailable", event);
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  }

  function setPlay(blob) {
    audioRef.current.src = null;
    audioRef.current.srcObject = null;
    audioRef.current.src = window.URL.createObjectURL(blob);
    audioRef.current.controls = true;
    // audioRef.current.play();
  }

  async function startRecording() {
    recordedChunks = [];
    // var options = { mimeType: "audio/webm;codecs=opus" };
    // console.log(navigator.mediaDevices.getUserMedia(constraints));
    await navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      try {
        console.log(stream);
        mediaRecorder = new MediaRecorder(stream);
        console.log(mediaRecorder.state);
      } catch (e) {
        console.error("Exception while creating MediaRecorder:", e);
        return;
      }
    });

    mediaRecorder.onstop = (event) => {
      console.log("Recorder stopped: ", event);
      console.log("Recorded Blobs: ", recordedChunks);
      // set audio playback
      const superBuffer = new Blob(recordedChunks, {
        type: "audio/ogg;codecs=opus",
      });
      console.log("audio", superBuffer);
      // setPlay(superBuffer);
    };

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log("MediaRecorder started", mediaRecorder.state);
  }

  function stopRecording() {
    mediaRecorder.stop();
    console.log("MediaRecorder stopped", mediaRecorder.state);
  }

  // will make request to flask backend
  function handleAnalyze() {
    const audioBlob = new Blob(recordedChunks, {
      type: "audio/ogg;codecs=opus",
    });

    // upload form data
    var data = new FormData();
    data.append("audio", audioBlob, "audio");

    const URL = `${BACKEND_URL}/feedback/audio`;
    fetch(URL, {
      method: "POST",
      body: data,
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        setFeedback(data.feedback);
      });
  }

  function handleAnalyzeFileInput() {
    console.log(audioInputRef.current.files[0].name);
    // upload form data
    var data = new FormData();
    data.append(
      "audio",
      audioInputRef.current.files[0],
      audioInputRef.current.files[0].name
    );

    const URL = `${BACKEND_URL}/feedback/audio`;
    fetch(URL, {
      method: "POST",
      body: data,
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        setFeedback(data.feedback);
      });
  }

  function handleAnalyzeVocal() {
    const audioBlob = new Blob(recordedChunks, {
      type: "audio/ogg;codecs=opus",
    });

    // upload form data
    var data = new FormData();
    data.append("vocal", audioBlob, "vocal");

    const URL = `${BACKEND_URL}/feedback/vocal`;
    fetch(URL, {
      method: "POST",
      body: data,
    })
      .then((response) => {
        if (response.ok) return response.json();
      })
      .then((data) => {
        setFeedback(data.feedback);
      });
  }

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentChatUid, setCurrentChatUid] = useState("");
  const { currentUser } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    console.log(selectedFile);
  };

  async function sendAudio() {
    if (selectedFile) {
      // const audioBlob = new Blob(selectedFile, {
      //   type: "audio/ogg;codecs=opus",
      // });
      const reader = new FileReader();
      reader.onload = async function (e) {
        const blob = new Blob([new Uint8Array(e.target.result)], {
          type: selectedFile.type,
        });
        await startNewChatFromAudio(
          currentUser.uid,
          blob,
          updateChats,
          setCurrentChatUid
        );
      };
      reader.readAsArrayBuffer(selectedFile);
      return;
    }
    // TODO: change from mpeg?
    // if (selectedFile.type === "audio/mpeg") {
    //   await startNewChatFromAudio(currentUser.uid, selectedFile, updateChats);
    // }
    const audioBlob = new Blob(recordedChunks, {
      type: "audio/ogg;codecs=opus",
    });
    await startNewChatFromAudio(
      currentUser.uid,
      audioBlob,
      updateChats,
      setCurrentChatUid
    );
  }

  //   These functions are generated by Gemini, they have no use

  //   const handleStartRecording = () => {
  //     // Implement recording logic here
  //     console.log("Start recording clicked");
  //   };

  //   const handleUpload = () => {
  //     // Implement upload logic here, using the selectedFile
  //     if (selectedFile) {
  //       console.log("Uploading file:", selectedFile);
  //       // You can use fetch, axios, or Firebase Storage to upload the file
  //     } else {
  //       console.log("No file selected");
  //     }
  //   };

  const updateChats = () => {
    getUserChats(currentUser.uid).then((data) => {
      console.log(data);
      setChats(data);
    });
  };

  useEffect(() => {
    updateChats();
  }, []);

  useEffect(() => {
    if (currentChatUid != "") {
      getUserMessages(currentUser.uid, currentChatUid).then((data) => {
        console.log("Messages");
        console.log(data);
        setCurrentChat(data);
      });
    } else {
      setCurrentChat(null);
    }
  }, [currentChatUid]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="dashboard">
      <aside className={`dashboard-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="menu-icon" onClick={toggleSidebar}>
            ☰
          </div>
        </div>

        <div
          className="new-chat"
          onClick={() => {
            setCurrentChatUid("");
          }}
        >
          <div className="new-chat-icon">+</div>
          {!isCollapsed && <span>New chat</span>}
        </div>

        {isCollapsed ? (
          <></>
        ) : chats != null ? (
          <>
            <div className="sidebar-section">
              <div className="section-title">Recent</div>
              <ul className="section-list">
                {chats.map((chat) => {
                  console.log(chat);
                  return (
                    <li
                      key={chat.docId}
                      className="list-item"
                      onClick={() => {
                        setCurrentChatUid(chat.docId);
                      }}
                    >
                      <span>{chat.name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        ) : (
          <div>Loading</div>
        )}
      </aside>
      <div className="dashboard-main">
        {currentChat ? (
          <div className="dashboard-wrapper">
            <DashboardChat chat={currentChat} />
          </div>
        ) : (
          <div className="dashboard-content">
            <div className="input-section"></div>
            <div className="button-section">
              <button onClick={() => startRecording()}>Start recording</button>
              <button onClick={() => stopRecording()}>Stop recording</button>
              <button onClick={() => sendAudio()}>Upload</button>
            </div>
          </div>
        )}
        <input
          type="file"
          accept="audio/*, application/pdf"
          onChange={handleFileChange}
        />
        {currentChatUid && (
          <textarea name="" id="input-field" defaultValue={"Input"} />
        )}
      </div>
    </div>
  );
}

export default Dashboard;

{
  /* <>
          <div className="sidebar-section">
            <div className="section-title">Recent</div>
            <ul className="section-list">
              <li className="list-item active">
                <div className="list-icon">☰</div>
                <span>React TypeScript front-end h...</span>
              </li>
              <li className="list-item">
                <div className="list-icon">☰</div>
                <span>React Router TypeScript Guide</span>
              </li>
              <li className="list-item">
                <div className="list-icon">☰</div>
                <span>Generate a background that is...</span>
              </li>
              <li className="list-item">
                <div className="list-icon">☰</div>
                <span>React Startup Home Page</span>
              </li>
              <li className="list-item">
                <div className="list-icon">☰</div>
                <span>Integral Convergence Compari...</span>
              </li>
              <li className="list-item more">
                <div className="list-icon">▼</div>
                <span>More</span>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <div className="section-title">Gems</div>
            <ul className="section-list">
              <li className="list-item">
                <div className="list-icon gem-icon">
                  <span role="img" aria-label="gem">
                    &#x1F48E;
                  </span>
                </div>
                <span>Chess champ</span>
              </li>
              <li className="list-item">
                <div className="list-icon gem-icon">
                  <span role="img" aria-label="gem">
                    &#x1F48E;
                  </span>
                </div>
                <span>Brainstormer</span>
              </li>
              <li className="list-item">
                <div className="list-icon gem-icon">
                  <span role="img" aria-label="gem">
                    &#x1F48E;
                  </span>
                </div>
                <span>Career guide</span>
              </li>
              <li className="list-item more">
                <div className="list-icon">▼</div>
                <span>More</span>
              </li>
            </ul>
          </div>

          <div className="sidebar-footer">
            <ul className="footer-list">
              <li className="footer-item">
                <div className="footer-icon">
                  <span role="img" aria-label="gem">
                    &#x1F48E;
                  </span>
                </div>
                <span>Gem manager</span>
              </li>
              <li className="footer-item">
                <div className="footer-icon">
                  <span role="img" aria-label="help">
                    &#x2753;
                  </span>
                </div>
                <span>Help</span>
              </li>
              <li className="footer-item">
                <div className="footer-icon">
                  <span role="img" aria-label="activity">
                    &#x1F3C3;
                  </span>
                </div>
                <span>Activity</span>
                <div className="notification-dot"></div>
              </li>
              <li className="footer-item">
                <div className="footer-icon">
                  <span role="img" aria-label="settings">
                    &#x2699;
                  </span>
                </div>
                <span>Settings</span>
                <div className="notification-dot"></div>
              </li>
            </ul>
            <div className="location">
              <span role="img" aria-label="location">
                &#x1F535;
              </span>
              <span>Toronto, ON, Canada</span>
              <span className="update-location">Update location</span>
            </div>
          </div>
        </> */
}
