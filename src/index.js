import React from "react";
import ReactDOM from "react-dom";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import "./styles.css";

class App extends React.Component {
  componentDidMount() {
    const video = document.getElementById("video");

    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    // Check that the browser supports getUserMedia.
    // If it doesn't show an alert, otherwise continue.
    if (navigator.getUserMedia) {
      // Request the camera.
      const webCamPromise = navigator.getUserMedia(
        // Constraints
        {
          video: {
            facingMode: "environment",
          },
        },
        // Success Callback
        function(localMediaStream) {
          video.srcObject = localMediaStream;
          return new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
              video.play();
              resolve();
            };
          });
        },
        // Error Callback
        function(err) {
          console.log(
            "The following error occurred when trying to use getUserMedia: " +
              err,
          );
        },
      );

      const modelPromise = cocoSsd.load();
      Promise.all([modelPromise, webCamPromise]).then(values => {
        this.detectFrame(video, values[0]);
      });
    } else {
      alert("Sorry, your browser does not support getUserMedia");
    }
  }

  detectFrame = (video, model) => {
    model.detect(video).then(predictions => {
      this.renderPredictions(predictions);
      requestAnimationFrame(() => {
        this.detectFrame(video, model);
      });
    });
  };

  renderPredictions = predictions => {
    const c = document.getElementById("canvas");
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Font options.
    const font = "14px Helvetica";
    ctx.font = font;
    ctx.textBaseline = "top";
    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      const width = prediction.bbox[2];
      const height = prediction.bbox[3];
      // Draw the bounding box.
      ctx.strokeStyle = "#00FF";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      // Draw the label background.
      ctx.fillStyle = "#00FF";
      const textWidth = ctx.measureText(prediction.class).width;
      const textHeight = parseInt(font, 10); // base 10
      ctx.fillRect(x, y, textWidth + 2, textHeight + 2);
    });

    predictions.forEach(prediction => {
      const x = prediction.bbox[0];
      const y = prediction.bbox[1];
      // Draw the text last to ensure it's on top.
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(prediction.class, x, y);
    });
  };

  render() {
    return (
      <div>
        <video id="video" width="375" height="375" autoPlay playsInline />
        <canvas id="canvas" width="375" height="375" />
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
