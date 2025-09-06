import WindowManager from './WindowManager.js'


// 引用 THREE.js 库
const t = THREE; 
// 分别用于存储相机、场景、渲染器和世界对象
let camera, scene, renderer, world; 
// 用于设置相机的近裁剪面和远裁剪面
let near, far; 
// 获取设备像素比，如果无法获取，则默认为 1
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1; 
// 用于存储场景中的立方体对象
let cubes = []; 
// 目标场景偏移量，用于平滑移动场景
let sceneOffsetTarget = { x: 0, y: 0 }; 
// 当前场景偏移量
let sceneOffset = { x: 0, y: 0 }; 

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

// get time in seconds since beginning of the day (so that all windows use the same time)
// 获取一天开始的时间（秒），以便所有窗口使用相同的时间。
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}

// 清除本地存储或初始化场景
if (new URLSearchParams(window.location.search).get("clear")) {
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	// 这段代码对于避免某些浏览器在实际访问URL之前预加载页面内容至关重要。
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden') {
			init();
		}
	};

	// 初始化场景
	function init() {
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		// 添加一个较短延迟，因为window.offsetX在短时间段内报告错误值。
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)
	}

	// 设置场景
	function setupScene() {
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);

		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add(camera);

		renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
		renderer.setPixelRatio(pixR);

		world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild(renderer.domElement);
	}

	// 设置窗口管理器
	function setupWindowManager() {
		windowManager = new WindowManager();
		// 设置窗口形状变化回调函数
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		// 设置窗口变化回调函数
		windowManager.setWinChangeCallback(windowsUpdated);

		// 在这里可以为每个窗口实例添加自定义元数据
		let metaData = { foo: "bar" };

		// 这将初始化窗口管理器并将此窗口添加到集中的窗口池中
		windowManager.init(metaData);

		// 初始时调用更新窗口（稍后将由窗口更改回调函数调用）
		windowsUpdated();
	}

	// 窗口更新回调函数
	function windowsUpdated() {
		// 更新立方体数量
		updateNumberOfCubes();
	}

	// 更新立方体数量
	function updateNumberOfCubes() {
		let wins = windowManager.getWindows();

		// 移除所有立方体
		cubes.forEach((c) => {
			world.remove(c);
		})

		cubes = [];

		// 根据当前窗口设置添加新的立方体
		for (let i = 0; i < wins.length; i++) {
			let win = wins[i];

			let c = new t.Color();
			c.setHSL(i * .1, 1.0, .5);

			let s = 100 + i * 50;
			let cube = new t.Mesh(new t.BoxGeometry(s, s, s), new t.MeshBasicMaterial({ color: c, wireframe: true }));
			cube.position.x = win.shape.x + (win.shape.w * .5);
			cube.position.y = win.shape.y + (win.shape.h * .5);

			world.add(cube);
			cubes.push(cube);
		}
	}

	// 更新窗口形状
	function updateWindowShape(easing = true) {
		// 将实际偏移存储在代理中，在渲染函数中根据代理更新
		sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
		if (!easing) sceneOffset = sceneOffsetTarget;
	}

	// 渲染函数
	function render() {
		let t = getTime();

		windowManager.update();

		// 根据当前偏移和新偏移之间的差值乘以衰减值（以创建平滑效果）计算新位置
		let falloff = .05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		// 将世界位置设置为偏移量
		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();

		// 根据当前窗口位置更新所有立方体的位置
		for (let i = 0; i < cubes.length; i++) {
			let cube = cubes[i];
			let win = wins[i];
			let _t = t;// + i * .2;

			let posTarget = { x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5) }

			cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
			cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
			cube.rotation.x = _t * .5;
			cube.rotation.y = _t * .3;
		};

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	// 调整渲染器大小以适应窗口大小
	function resize() {
		let width = window.innerWidth;
		let height = window.innerHeight

		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
	}
}