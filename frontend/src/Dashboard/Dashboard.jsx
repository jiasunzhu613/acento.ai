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

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRef = useRef(null);

  const audioInputRef = useRef();
  const [feedback, setFeedback] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  function handleDataAvailable(event) {
    console.log("handleDataAvailable:", event);
    if (event.data && event.data.size > 0) {
      recordedChunksRef.current.push(event.data);
    }
  }

  function handleStop(event) {
    console.log("Recorder stopped:", event);
    console.log("Recorded Blobs:", recordedChunksRef.current);

    // If you want to play it back or do something with the blob here:
    const superBuffer = new Blob(recordedChunksRef.current, {
      type: "audio/ogg;codecs=opus",
    });
    setSelectedFile(superBuffer);
    console.log("audio blob:", superBuffer);
    // Optionally set up audio playback
    // setPlay(superBuffer);
  }

  async function startRecording() {
    try {
      recordedChunksRef.current = []; // reset for new recording
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = handleStop;

      mediaRecorder.start();
      console.log("MediaRecorder started:", mediaRecorder.state);
      setIsRecording(true);
    } catch (error) {
      console.error("Exception while creating MediaRecorder:", error);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      console.log("MediaRecorder stopped:", mediaRecorderRef.current.state);
      setIsRecording(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (
      file &&
      (file.type === "audio/mpeg" || file.type === "application/pdf")
    ) {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
      setError("Invalid file type. Please upload an audio/mpeg or PDF file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (
      file &&
      (file.type === "audio/mpeg" || file.type === "application/pdf")
    ) {
      setSelectedFile(file);
      setError(null);
    } else {
      setSelectedFile(null);
      setError("Invalid file type. Please upload an audio/mpeg or PDF file.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = () => {
    sendAudio();
  };

  const handleAudioChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      setAudioBlob(null);
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setErrorMessage("Please select an audio file.");
      setAudioBlob(null);
      return;
    }

    setErrorMessage(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      setAudioBlob(blob);
    } catch (error) {
      console.error("Error converting audio to blob:", error);
      setErrorMessage("Error processing audio file.");
      setAudioBlob(null);
    }
  };

  //   function handleDataAvailable(event) {
  //     console.log("handleDataAvailable", event);
  //     if (event.data && event.data.size > 0) {
  //       recordedChunks.push(event.data);
  //     }
  //   }

  function setPlay(blob) {
    audioRef.current.src = null;
    audioRef.current.srcObject = null;
    audioRef.current.src = window.URL.createObjectURL(blob);
    audioRef.current.controls = true;
    // audioRef.current.play();
  }

  //   async function startRecording() {
  //     setIsRecording(true);
  //     let recordedChunks = [];
  //     // var options = { mimeType: "audio/webm;codecs=opus" };
  //     // console.log(navigator.mediaDevices.getUserMedia(constraints));
  //     try {
  //       recordedChunksRef.current = []; // reset for new recording
  //       const stream = await navigator.mediaDevices.getUserMedia(constraints);

  //       const mediaRecorder = new MediaRecorder(stream);
  //       mediaRecorderRef.current = mediaRecorder;

  //       mediaRecorder.ondataavailable = handleDataAvailable;
  //       mediaRecorder.onstop = stopRecording;

  //       mediaRecorder.start();
  //       console.log("MediaRecorder started:", mediaRecorder.state);
  //     } catch (error) {
  //       console.error("Exception while creating MediaRecorder:", error);
  //     }

  //     mediaRecorderRef.current.onstop = (event) => {
  //       console.log("Recorder stopped: ", event);
  //       console.log("Recorded Blobs: ", recordedChunks);
  //       // set audio playback
  //       const superBuffer = new Blob(recordedChunks, {
  //         type: "audio/ogg;codecs=opus",
  //       });
  //       console.log("audio", superBuffer);
  //       // setPlay(superBuffer);
  //     };

  //     mediaRecorderRef.current.ondataavailable = handleDataAvailable;
  //     mediaRecorderRef.current.start();
  //     console.log(
  //       "mediaRecorderRef.current started",
  //       mediaRecorderRef.current.state
  //     );
  //   }

  //   function stopRecording() {
  //     setIsRecording(false);
  //     console.log("Recorder stopped:", event);
  //     console.log("Recorded Blobs:", recordedChunksRef.current);

  //     // If you want to play it back or do something with the blob here:
  //     const superBuffer = new Blob(recordedChunksRef.current, {
  //       type: "audio/ogg;codecs=opus",
  //     });
  //     console.log("audio blob:", superBuffer);
  //     // Optionally set up audio playback
  //     // setPlay(superBuffer);
  //   }

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

  //   const [selectedFile, setSelectedFile] = useState(null);

  //   const handleFileChange = (event) => {
  //     setSelectedFile(event.target.files[0]);
  //     console.log(selectedFile);
  //   };

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
              {/* <button onClick={() => startRecording()}>Start recording</button>
              <button onClick={() => stopRecording()}>Stop recording</button>
              <button onClick={() => sendAudio()}>Upload</button>
              <input
                type="file"
                accept="audio/*, application/pdf"
                onChange={handleAudioChange}
              /> */}
              <div
                className="file-upload-container"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  accept="audio/mpeg, application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  //   className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  {selectedFile
                    ? selectedFile.name
                    : "Drag & drop or click to upload"}
                </label>

                {error && <p className="error-message">{error}</p>}

                {selectedFile && (
                  <button className="upload-button" onClick={handleUpload}>
                    Upload
                  </button>
                )}
              </div>
              {isRecording && (
                <button onClick={() => stopRecording()}>Stop recording</button>
              )}
              {!isRecording && (
                <button onClick={() => startRecording()}>
                  Start recording
                </button>
              )}
            </div>
          </div>
        )}
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
