"use strict";

const video = document.getElementById('video'),
	  videoSize = document.querySelector('.video_block_item'),
	  videoButton = document.getElementById('video_button'),
	  videoSection = document.querySelector('.video_block');

let labelName;
	  
const switchEvent = videoButton.addEventListener("click", () => {

		videoButton.classList.toggle("switch");
		if (videoButton.textContent == "увімкнути") {
			videoButton.textContent = "вимкнути";
			startVideo();
		} else {
			videoButton.textContent = "увімкнути";
			stopVideo();
		}
	
});

Promise.all([
	faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
	faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
	faceapi.nets.ssdMobilenetv1.loadFromUri('./models')
]).then(switchEvent);

function startVideo() {
	console.log("Turning the video on...");

	recognizeFaces();

	navigator.getUserMedia(
		{ video: {} },
		stream => video.srcObject = stream,
		err => console.error(err),
	);
}

async function recognizeFaces() {
	const labeledDescriptors = await loadLabeledImages();
	console.log(labeledDescriptors);
	const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
	const message = {
		loading: "img/spinner.svg",
		msg: "Завантаження моделей..."
	};
	const statusMessage = document.createElement(`img`);
	const statusDescr = document.createElement(`div`);
	statusMessage.src = message.loading;
	statusMessage.style.cssText = `
		display: block;
		margin: 0 auto;
		margin-top: 10px;
		width: 70px;
		height: 70px;
	`;
	statusDescr.textContent = message.msg;
	statusDescr.style.cssText = `
		display: flex;
		justify-content: center;
		color: white;
		font-size: 18px;
	`;
	videoSection.append(statusMessage, statusDescr);

		video.addEventListener('play', async () => {
			let labelName;
			statusMessage.remove();
			statusDescr.remove();

			console.log('Playing');
			const canvas = faceapi.createCanvasFromMedia(video);
			videoSize.append(canvas);
			const displaySize = { width: video.clientWidth, height: video.clientHeight };
			faceapi.matchDimensions(canvas, displaySize);

			setInterval(async () => {
				const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
				const resizedDetections = faceapi.resizeResults(detections, displaySize);
				canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
	
				const results = resizedDetections.map((d) => {
					return faceMatcher.findBestMatch(d.descriptor);
				});
				results.forEach( (result, i) => {
					const box = resizedDetections[i].detection.box;
					const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
					drawBox.draw(canvas);
					labelName = result.toString();
					return labelName;
				});
			}, 100);
		});	
}

function loadLabeledImages() {
	const labels = ['Vladyslav Khrystevych', 'Parhomenko', 'Bohdan Solovyov', 'German Shynder', 'Nikolay Sokolovskiy'];
	return Promise.all(
		labels.map(async (label) => {
			const descriptions = [];
			for (let i = 1; i <= 4; i++) {
				const img = await faceapi.fetchImage(`img/${label}/${1}.jpg`);
				const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
				// console.log(label + i + JSON.stringify(detections));
				descriptions.push(detections.descriptor);
			}
			console.log(label + 'Faces Loaded');
			return new faceapi.LabeledFaceDescriptors(label, descriptions);
		})
	);
}

function stopVideo() {
	console.log("Turning the video off...");
	const tracks = video.srcObject.getTracks();
	tracks.forEach(track => track.stop());	
}

