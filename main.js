import AgoraRTC from "agora-rtc-sdk-ng";

let options = {
  appId: "8d655c15d6bf42349cee11db48c1c5b2",

  channel: "test2",

  token:
    "007eJxTYPglvjXh8FOvRBFbrQ8vg6PWpKQteLz9O1O2vLxW8kl1tmAFBosUM1PTZEPTFLOkNBMjYxPL5NRUQ8OUJBOLZMNk0ySjQ16CqQ2BjAw6fCdYGRkgEMRnZShJLS4xYmAAACATHfk=",

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
  const agoraEngine = AgoraRTC.createClient({ mode: "live", codec: "vp9" });

  const remotePlayerContainer = document.createElement("div");

  const localPlayerContainer = document.createElement("div");

  localPlayerContainer.id = options.uid;

  localPlayerContainer.textContent = "Local user " + options.uid;

  localPlayerContainer.style.width = "640px";
  localPlayerContainer.style.height = "480px";
  localPlayerContainer.style.padding = "15px 5px 5px 5px";

  remotePlayerContainer.style.width = "640px";
  remotePlayerContainer.style.height = "480px";
  remotePlayerContainer.style.padding = "15px 5px 5px 5px";

  agoraEngine.on("user-published", async (user, mediaType) => {
    await agoraEngine.subscribe(user, mediaType);
    if (mediaType == "video") {
      channelParameters.remoteVideoTrack = user.videoTrack;

      channelParameters.remoteAudioTrack = user.audioTrack;

      remotePlayerContainer.id = user.uid.toString();
      channelParameters.remoteUid = user.uid.toString();
      remotePlayerContainer.textContent = "Remote user " + user.uid.toString();

      document.body.append(remotePlayerContainer);
      if (options.role != "host") {
        channelParameters.remoteVideoTrack.play(remotePlayerContainer);
      }
    }

    if (mediaType == "audio") {
      channelParameters.remoteAudioTrack = user.audioTrack;

      channelParameters.remoteAudioTrack.play();
    }

    agoraEngine.on("user-unpublished", (user) => {
      console.log(user.uid + "has left the channel");
    });
  });

  const containerEl = document.querySelector(".container");
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
          await AgoraRTC.createMicrophoneAudioTrack();
        await agoraEngine.publish(channelParameters.localAudioTrack);
        channelParameters.localAudioTrack.play();
      }
      channelParameters.localVideoTrack =
        await AgoraRTC.createCameraVideoTrack();
      containerEl.append(localPlayerContainer);
      await agoraEngine.publish(channelParameters.localVideoTrack);
      channelParameters.localVideoTrack.play(localPlayerContainer);
    }

    if (e.target.closest("#audio")) {
      if (channelParameters.localVideoTrack) {
        // TODO Improve this line to remove the video container from the dom
        localPlayerContainer.querySelector("div").remove();
        channelParameters.localVideoTrack = null;
        await agoraEngine.unpublish(channelParameters.localVideoTrack);
      }

      if (channelParameters.localAudioTrack) return;
      channelParameters.localAudioTrack =
        await AgoraRTC.createMicrophoneAudioTrack();
      await agoraEngine.publish(channelParameters.localAudioTrack);
      channelParameters.localAudioTrack.play();
    }

    // Student's logic, Markup and event listeners
    if (e.target.closest(".student-btn")) {
      containerEl.innerHTML = `<button type="button" id="join">Join Stream</button>
        <button type="button" id="leave">Leave</button>`;

      options.role = "audience";
      await agoraEngine.setClientRole(options.role);
    }
    if (e.target.closest("#join")) {
      const clientRoleOptions = { level: 1 }; // Use Low latency mode

      if (
        channelParameters.localAudioTrack &&
        channelParameters.localVideoTrack
      ) {
        await agoraEngine.unpublish([
          channelParameters.localAudioTrack,
          channelParameters.localVideoTrack,
        ]);
        channelParameters.localVideoTrack.stop();
        if (channelParameters.remoteVideoTrack) {
          channelParameters.remoteVideoTrack.play(remotePlayerContainer);
        }
      }

      await agoraEngine.setClientRole(options.role, clientRoleOptions);
    }
    if (e.target.closest("#leave")) {
      channelParameters.localAudioTrack.close();
      channelParameters.localVideoTrack.close();

      remotePlayerContainer.remove();
      localPlayerContainer.remove();

      await agoraEngine.leave();

      window.location.reload();
    }
  });
}

startBasicCall();
