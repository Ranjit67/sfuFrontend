import {
  // useEffect,
  // useState,
  useRef,
} from "react";
import { io } from "socket.io-client";

export default function View() {
  const peerRef = useRef();
  const pc = useRef();
  const socketRef = useRef();
  // const isMounted = useRef(false);
  // useEffect(() => {
  //   isMounted.current = true;
  //   isMounted.current && wholeProcess();
  //   return () => (isMounted.current = false);
  // }, []);

  const socketFn = () => {
    // socketRef.current = io.connect("http://localhost:9000/stream");
    socketRef.current = io.connect("https://sfuvideo.herokuapp.com/stream");
    pc.current = createPeer();
    // console.log(pc.current);
    pc.current.addTransceiver("video", { direction: "recvonly" });
    pc.current.createOffer().then((offer) => {
      pc.current.setLocalDescription(offer).then((desc) => {
        socketRef.current.emit("offer_user", {
          offer: pc.current.localDescription,
        });
      });
    });

    socketRef.current.on("answer_to_user", (payload) => {
      const { answer } = payload;
      const desc = new RTCSessionDescription(answer);
      pc.current.setRemoteDescription(desc).catch((error) => {
        console.log(error);
      });
    });
    if (pc.current) {
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          // console.log(event.candidate);
          socketRef.current.emit("ice_commes_from_user", {
            ice: event.candidate,
          });
        }
      };
      // events
      pc.current.onconnectionstatechange = (event) => {
        console.log("===0***===");
        console.log("onconnectionstatechange", event);
        console.log("pc.current.connectionState", pc.current?.connectionState);
        console.log("===0***===");
      };
      pc.current.oniceconnectionstatechange = async (event) => {
        if (pc.current?.iceConnectionState === "failed") {
          await pc.current.restartIce();
          console.log("hit restart");
        }

        console.log("===1***===");
        console.log("oniceconnectionstatechange ", event);
        console.log(
          "pc.current.iceConnectionState ",
          pc.current?.iceConnectionState
        );
        console.log("===1***===");
      };
      pc.current.onicegatheringstatechange = (event) => {
        console.log("===2***===");
        console.log("onicegatheringstatechange ", event);
        console.log(
          "pc.current.iceGatheringState",
          pc.current?.iceGatheringState
        );
        console.log("===2***===");
      };
      // events end
    }
    // come ice
    socketRef.current.on("ice_user", (payload) => {
      const { ice } = payload;
      if (ice) {
        pc.current.addIceCandidate(ice).catch((error) => console.log(error));
      }
    });
    socketRef.current.on("event", (payload) => {
      console.log(payload);
    });
  };

  const wholeProcess = async () => {
    const peer = await createPeer();
    peer.addTransceiver("video", { direction: "recvonly" });
  };

  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
        { urls: "stun:stun.ekiga.net" },
        { urls: "stun:stun.schlund.de" },
        { urls: "stun:stun.l.google.com:19302" },

        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.softjoys.com" },
        { urls: "stun:stun.voipbuster.com" },
        { urls: "stun:stun.voipstunt.com" },
        { urls: "stun:stun.xten.com" },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com",
        },
        {
          urls: "turn:192.158.29.39:3478?transport=udp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
        {
          urls: "turn:192.158.29.39:3478?transport=tcp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
      ],
    });
    peer.ontrack = handleTrackEvent;
    // peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
  };
  function handleTrackEvent(e) {
    peerRef.current.srcObject = e.streams[0];
    // console.log(e.streams[0]);
  }
  const handleNegotiationNeededEvent = async (peer) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    console.log(socketRef.current);
    const { answer } = await fetchFunction(peer.localDescription, peer);
    const desc = new RTCSessionDescription(answer);
    await peer.setRemoteDescription(desc);
    // console.log(peer);
    peer.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log(event.candidate);
        iceFetch(event.candidate, peer);
        // sendCandidateToRemotePeer(event.candidate);
      } else {
        /* there are no more candidates coming during this negotiation */
      }
    };
    console.log(peer);
  };
  const fetchFunction = async (sdp, peer) => {
    try {
      // https://sfuvideo.herokuapp.com/consumer
      // http://localhost:9000/consumer
      const response = await fetch("https://sfuvideo.herokuapp.com/consumer", {
        method: "POST",
        body: JSON.stringify({
          sdp,
          // ice,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      });
      const result = await response.json();
      if (result?.error) {
        console.log(result?.error);
      }
      // const ice = [];
      console.log(result);

      return result;
    } catch (error) {
      console.log(error);
    }
  };

  const iceFetch = async (ice, peer) => {
    const response2 = await fetch(
      "https://sfuvideo.herokuapp.com/streamDisplayIce",
      {
        method: "POST",
        body: JSON.stringify({
          ice: ice,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }
    );
    const result2 = await response2.json();
    //
    result2.ice?.forEach(async (iceOther) => {
      await peer.addIceCandidate(iceOther);
    });
    peer.oniceconnectionstatechange = (ev) => {
      console.log(ev);
    };
    // peer.onicegatheringstatechange = function () {
    //   // let label = "Unknown";
    //   switch (peer.iceGatheringState) {
    //     case "new":
    //       console.log("new");

    //       break;
    //     case "complete":
    //       console.log("complete");
    //       break;
    //     case "gathering":
    //       console.log("gathering");
    //       break;

    //     default:
    //       break;
    //   }
    // };
    console.log(peer);
  };
  return (
    <div>
      <button onClick={socketFn}>view</button>
      <video playsInline autoPlay ref={peerRef} />
    </div>
  );
}
