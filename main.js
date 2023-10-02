import * as AgoraRTC from "agora-rtc-sdk-ng";

let options = {
  appId: "8d655c15d6bf42349cee11db48c1c5b2",

  channel: "test",

  token:
    "00631ad69a8d07a48dd9c5363d0010a2feaIAC98s9Ariu3YkNVPkxOeI9aJebOYZbESbEEtt8COeyOAbIg72IAAAAACgBQv",

  uid: Math.floor(Math.random() * 10000),

  role: "",
};

let channelParameters = {
  localAudioTrack: null,

  localVideoTrack: null,

  remoteAudioTrack: null,

  remoteVideoTrack: null,

  remoteUid: null,
};

async function startBasicCall() {
  const containerEl = document.querySelector(".container");
  const agoraEngine = AgoraRTC.createClient({ mode: "live", codec: "vp9" });

  const remotePlayerContainer = document.createElement("div");

  const localPlayerContainer = document.createElement("div");

  localPlayerContainer.id = options.uid;
  localPlayerContainer.className = "video-container";

  localPlayerContainer.style.width = "640px";
  localPlayerContainer.style.height = "480px";
  localPlayerContainer.style.padding = "15px 5px 5px 5px";

  remotePlayerContainer.style.width = "640px";
  remotePlayerContainer.style.height = "480px";
  remotePlayerContainer.style.padding = "15px 5px 5px 5px";
  remotePlayerContainer.className = "remote-container";

  agoraEngine.on("user-published", async (user, mediaType) => {
    await agoraEngine.subscribe(user, mediaType);
    channelParameters.remoteVideoTrack = user.videoTrack;
    channelParameters.remoteAudioTrack = user.audioTrack;
    if (mediaType == "video") {
      remotePlayerContainer.id = user.uid.toString();
      channelParameters.remoteUid = user.uid.toString();

      if (options.role === "audience") {
        document.body.append(remotePlayerContainer);
        channelParameters.remoteVideoTrack.play(remotePlayerContainer);
      }
    }

    if (mediaType == "audio") {
      if (options.role === "audience") {
        channelParameters.remoteAudioTrack.play();
      }
    }

    agoraEngine.on("user-unpublished", () => {
      channelParameters.remoteVideoTrack = null;
      if (
        options.role === "audience" &&
        remotePlayerContainer.querySelector("div")
      )
        remotePlayerContainer.querySelector("div").remove();
    });
  });

  await agoraEngine.join(
    options.appId,
    options.channel,
    options.token,
    options.uid
  );

  containerEl.addEventListener("click", async (e) => {
    // Teacher's logic, Markup and event listeners
    if (e.target.closest(".teacher-btn")) {
      containerEl.innerHTML = `
                                <button type="button" id="audio">Stream audio</button>
                                <button type="button" id="video">Stream Video</button>
                                <button type="button" id="leave">Leave</button>`;

      options.role = "host";
      await agoraEngine.setClientRole(options.role);
    }

    if (e.target.closest("#video")) {
      e.target.disabled = true;
      containerEl.querySelector("#audio").disabled = false;
      if (!document.querySelector(".row").querySelector("h3")) {
        document
          .querySelector(".row")
          .insertAdjacentHTML(
            "beforeend",
            `<h3>Teacher Id: ${options.uid}</h3>`
          );
      }
      if (
        channelParameters.localAudioTrack &&
        channelParameters.localVideoTrack
      )
        return;

      if (channelParameters.remoteVideoTrack) {
        channelParameters.remoteVideoTrack.stop();
      }

      if (!channelParameters.localAudioTrack) {
        channelParameters.localAudioTrack =
          await AgoraRTC.createMicrophoneAudioTrack({ AGC: false });
        await agoraEngine.publish(channelParameters.localAudioTrack);
      }

      channelParameters.localVideoTrack =
        await AgoraRTC.createCameraVideoTrack();
      document.body.append(localPlayerContainer);
      await agoraEngine.publish(channelParameters.localVideoTrack);
      channelParameters.localVideoTrack.play(localPlayerContainer);
    }

    if (e.target.closest("#audio")) {
      e.target.disabled = true;
      containerEl.querySelector("#video").disabled = false;
      if (!document.querySelector(".row").querySelector("h3")) {
        document
          .querySelector(".row")
          .insertAdjacentHTML(
            "beforeend",
            `<h3>Teacher Id: ${options.uid}</h3>`
          );
      }
      if (channelParameters.localVideoTrack) {
        // TODO Improve this line to remove the video container from the dom
        localPlayerContainer.querySelector("div").remove();

        await agoraEngine.unpublish(channelParameters.localVideoTrack);
        channelParameters.localVideoTrack = null;
      }

      if (channelParameters.localAudioTrack) return;
      channelParameters.localAudioTrack =
        await AgoraRTC.createMicrophoneAudioTrack();
      await agoraEngine.publish(channelParameters.localAudioTrack);
    }

    // Student's logic, Markup and event listeners
    if (e.target.closest(".student-btn")) {
      containerEl.innerHTML = `<button type="button" id="join">Join Stream</button>
        <button type="button" id="leave">Leave</button>`;
    }
    if (e.target.closest("#join")) {
      e.target.disabled = true;
      options.role = "audience";
      const clientRoleOptions = { level: 1 }; // Use Low latency mode
      await agoraEngine.setClientRole(options.role, clientRoleOptions);
      channelParameters.remoteAudioTrack.play();
      document
        .querySelector(".row")
        .insertAdjacentHTML("beforeend", `<h3>Student Id: ${options.uid}</h3>`);

      if (
        channelParameters.remoteAudioTrack &&
        channelParameters.remoteVideoTrack
      ) {
        document.body.append(remotePlayerContainer);
        channelParameters.remoteVideoTrack.play(remotePlayerContainer);
      }
    }
    if (e.target.closest("#leave")) {
      remotePlayerContainer.remove();
      localPlayerContainer.remove();

      await agoraEngine.leave();

      window.location.reload();
    }
  });
}

startBasicCall();
