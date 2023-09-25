import AgoraRTC from "agora-rtc-sdk-ng";

let options = {
  appId: "8d655c15d6bf42349cee11db48c1c5b2",

  channel: "test2",

  token:
    "007eJxTYPglvjXh8FOvRBFbrQ8vg6PWpKQteLz9O1O2vLxW8kl1tmAFBosUM1PTZEPTFLOkNBMjYxPL5NRUQ8OUJBOLZMNk0ySjQ16CqQ2BjAw6fCdYGRkgEMRnZShJLS4xYmAAACATHfk=",

  uid: 0,

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

      channelParameters.remoteUid = user.uid.toString();

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

  window.onload = function () {
    document.getElementById("join").onclick = async function () {
      if (options.role == "") {
        window.alert("Select a user role first!");
        return;
      }

      await agoraEngine.join(
        options.appId,
        options.channel,
        options.token,
        options.uid
      );

      channelParameters.localAudioTrack =
        await AgoraRTC.createMicrophoneAudioTrack();

      channelParameters.localVideoTrack =
        await AgoraRTC.createCameraVideoTrack();

      document.body.append(localPlayerContainer);

      if (options.role === "host") {
        await agoraEngine.publish(channelParameters.localAudioTrack);
        channelParameters.localAudioTrack.play();

        document.getElementById("video").onclick = async function () {
          await agoraEngine.publish(channelParameters.localVideoTrack);

          channelParameters.localVideoTrack.play(localPlayerContainer);
        };
        document.getElementById("audio").onclick = async function () {
          await agoraEngine.unpublish(channelParameters.localVideoTrack);

          channelParameters.localVideoTrack.stop();
        };
      }
    };

    document.getElementById("leave").onclick = async function () {
      channelParameters.localAudioTrack.close();
      channelParameters.localVideoTrack.close();

      removeVideoDiv(remotePlayerContainer.id);
      removeVideoDiv(localPlayerContainer.id);

      await agoraEngine.leave();

      window.location.reload();
    };

    document.getElementById("host").onclick = async function () {
      if (document.getElementById("host").checked) {
        options.role = "host";

        await agoraEngine.setClientRole(options.role);
        if (channelParameters.localVideoTrack != null) {
          await agoraEngine.publish([
            channelParameters.localAudioTrack,
            channelParameters.localVideoTrack,
          ]);

          channelParameters.remoteVideoTrack.stop();

          channelParameters.localVideoTrack.play(localPlayerContainer);
        }
      }
    };
    document.getElementById("Audience").onclick = async function () {
      if (document.getElementById("Audience").checked) {
        options.role = "audience";
        const clientRoleOptions = { level: 1 }; // Use Low latency
        if (
          channelParameters.localAudioTrack != null &&
          channelParameters.localVideoTrack != null
        ) {
          await agoraEngine.unpublish([
            channelParameters.localVideoTrack,
            channelParameters.localAudioTrack,
          ]);
        }
        await agoraEngine.setClientRole(options.role, clientRoleOptions);
      }
    };
  };
}
startBasicCall();
// Remove the video stream from the container.
function removeVideoDiv(elementId) {
  let El = document.getElementById(elementId);
  if (El) {
    El.remove();
  }
}
