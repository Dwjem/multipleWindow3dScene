class WindowManager {
	#windows; // 窗口列表
	#count; // 窗口数量
	#id; // 当前窗口的ID
	#winData; // 窗口数据
	#winShapeChangeCallback; // 窗口形状变化的回调函数
	#winChangeCallback; // 窗口变化的回调函数


	constructor() {
		let that = this;

		// 监听 localStorage 的变化事件
		addEventListener("storage", (event) => {
			if (event.key == "windows") {
				// 解析新的窗口列表
				let newWindows = JSON.parse(event.newValue);
				// 检查窗口是否发生了变化
				let winChange = that.#didWindowsChange(that.#windows, newWindows);

				// 更新窗口列表
				that.#windows = newWindows;

				// 如果窗口发生了变化，并且存在窗口变化的回调函数，那么调用这个回调函数
				if (winChange) {
					if (that.#winChangeCallback) that.#winChangeCallback();
				}
			}
		});

		// 监听当前窗口即将关闭的事件
		window.addEventListener('beforeunload', function (e) {
			// 获取当前窗口在窗口列表中的索引
			let index = that.getWindowIndexFromId(that.#id);

			// 从窗口列表中移除当前窗口
			that.#windows.splice(index, 1);
			// 更新本地存储的窗口列表
			that.updateWindowsLocalStorage();
		});
	}

	// 检查窗口列表是否有变化
	#didWindowsChange(pWins, nWins) {
		// 如果旧的窗口列表和新的窗口列表的长度不同，返回 true
		if (pWins.length != nWins.length) {
			return true;
		}
		else {
			// 初始化变量 c 为 false
			let c = false;

			// 遍历旧的窗口列表
			for (let i = 0; i < pWins.length; i++) {
				// 如果旧的窗口列表和新的窗口列表中的相同索引位置的窗口 ID 不同，将 c 设置为 true
				if (pWins[i].id != nWins[i].id) c = true;
			}

			// 返回 c，如果 c 为 true，表示窗口列表有变化
			return c;
		}
	}

	// 初始化当前窗口（添加用于存储每个窗口实例的自定义数据的元数据）
	init(metaData) {
		// 从本地存储中获取窗口列表，如果不存在，则初始化为空数组
		this.#windows = JSON.parse(localStorage.getItem("windows")) || [];
		// 从本地存储中获取窗口数量，如果不存在，则初始化为 0
		this.#count = localStorage.getItem("count") || 0;
		// 窗口数量加 1
		this.#count++;

		// 设置当前窗口的 ID 为窗口数量
		this.#id = this.#count;
		// 获取当前窗口的形状
		let shape = this.getWinShape();
		// 创建一个包含窗口 ID、形状和元数据的对象
		this.#winData = { id: this.#id, shape: shape, metaData: metaData };
		// 将这个对象添加到窗口列表中
		this.#windows.push(this.#winData);

		// 将窗口数量保存到本地存储中
		localStorage.setItem("count", this.#count);
		// 更新本地存储中的窗口列表
		this.updateWindowsLocalStorage();
	}

	// 获取当前窗口的形状
	getWinShape() {
		let shape = { x: window.screenLeft, y: window.screenTop, w: window.innerWidth, h: window.innerHeight };
		return shape;
	}

	// 根据窗口 ID 获取窗口在窗口列表中的索引
	getWindowIndexFromId(id) {
		let index = -1;

		for (let i = 0; i < this.#windows.length; i++) {
			if (this.#windows[i].id == id) index = i;
		}

		return index;
	}

	// 将窗口列表保存到本地存储中
	updateWindowsLocalStorage() {
		localStorage.setItem("windows", JSON.stringify(this.#windows));
	}

	// 更新当前窗口的形状，并保存到窗口列表和本地存储中
	update() {
		// 获取当前窗口的形状
		let winShape = this.getWinShape();

		// 如果当前窗口的形状与保存在 #winData 中的形状不同
		if (winShape.x != this.#winData.shape.x ||
			winShape.y != this.#winData.shape.y ||
			winShape.w != this.#winData.shape.w ||
			winShape.h != this.#winData.shape.h) {

			// 更新 #winData 中的窗口形状
			this.#winData.shape = winShape;

			// 获取当前窗口在窗口列表中的索引
			let index = this.getWindowIndexFromId(this.#id);
			// 更新窗口列表中的窗口形状
			this.#windows[index].shape = winShape;

			// 如果存在窗口形状变化的回调函数，那么调用这个回调函数
			if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
			// 更新本地存储中的窗口列表
			this.updateWindowsLocalStorage();
		}
	}

	/**
	 * 设置窗口形状变化回调函数。
	 * @param {Function} callback - 窗口形状变化回调函数。
	 */
	setWinShapeChangeCallback(callback) {
		this.#winShapeChangeCallback = callback;
	}

	
	/**
	 * 设置窗口变化回调函数
	 * @param {Function} callback - 窗口变化回调函数
	 */
	setWinChangeCallback(callback) {
		this.#winChangeCallback = callback;
	}

	
	/**
	 * 获取窗口列表
	 * @returns {Array} 窗口列表
	 */
	getWindows() {
		return this.#windows;
	}

	
	/**
	 * 获取当前窗口的数据。
	 * @returns {Object} 当前窗口的数据。
	 */
	getThisWindowData() {
		return this.#winData;
	}

	
	/**
	 * 获取当前窗口的ID。
	 * @returns {number} 当前窗口的ID。
	 */
	getThisWindowID() {
		return this.#id;
	}
}

export default WindowManager;