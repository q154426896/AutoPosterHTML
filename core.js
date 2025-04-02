// 图层管理
class LayerManager {
    constructor() {
        this.layers = [];
        this.canvas = document.getElementById('mainCanvas');
        
        console.log('Canvas element:', this.canvas); // 调试日志
        
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log('Canvas context:', this.ctx); // 调试日志
        
        this.preloadQueue = new Set();
        this.loadedFonts = new Set();
        
        // 添加拖拽相关的状态
        this.isDragging = false;
        this.selectedLayer = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastTouchTime = 0;
        this.longPressTimeout = null;
        
        // 添加画布平移相关的状态
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // 添加缩放相关的状态
        this.scale = 1;
        this.minScale = 0.5;
        this.maxScale = 2;
        this.zoomStep = 0.1;
        this.zoomCenterX = 0;
        this.zoomCenterY = 0;
        this.canvasContainer = document.querySelector('.relative.bg-white.shadow-xl');
        
        this.initCanvas();
        this.initEventListeners();
        this.loadCustomFonts();
        
        // 添加文字层的实时更新
        this.initTextLayerListeners();
        this.initDragListeners();
        this.initZoomListeners();
    }

    initCanvas() {
        this.syncCanvasSize();
        window.addEventListener('resize', () => this.syncCanvasSize());
    }

    syncCanvasSize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        // 设置画布尺寸为固定值（与容器样式一致）
        this.canvas.width = 360;
        this.canvas.height = 480;
        
        console.log('Canvas size set to:', this.canvas.width, this.canvas.height);
        this.render();
    }

    initEventListeners() {
        // 背景层预览和选择
        const bgLibrary = document.getElementById('bgLibrary');
        const bgFiles = ['example.svg'];
        bgFiles.forEach(file => {
            fetch(`assets/backgrounds/${file}`)
                .then(response => response.text())
                .then(svgContent => {
                    const div = document.createElement('div');
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'bg-item';
                    const img = document.createElement('img');
                    img.src = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
                    imgWrapper.appendChild(img);
                    div.appendChild(imgWrapper);
                    imgWrapper.onclick = () => {
                        // 移除同类型项目的选中状态
                        bgLibrary.querySelectorAll('.bg-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        // 添加当前项目的选中状态
                        imgWrapper.classList.add('selected');
                        
                        const img = new Image();
                        img.onload = () => {
                            this.addLayer({
                                type: 'bg',
                                source: img,
                                x: 0,
                                y: 0,
                                width: this.canvas.width,
                                height: this.canvas.height,
                                zIndex: 0,
                                opacity: 1
                            });
                        };
                        img.src = `assets/backgrounds/${file}`;
                    };
                    bgLibrary.appendChild(div);
                });
        });

        // 初始化插图层和元素层
        const spriteLibrary = document.getElementById('spriteLibrary');
        const elementLibrary = document.getElementById('elementLibrary');

        // 加载所有插图
        const spriteFiles = ['example.svg', 'example copy.svg', 'example copy 2.svg'];
        spriteFiles.forEach(file => {
            fetch(`assets/sprites/${file}`)
                .then(response => response.text())
                .then(svgContent => {
                    const div = document.createElement('div');
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'sprite-item';
                    const img = document.createElement('img');
                    img.src = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
                    imgWrapper.appendChild(img);
                    div.appendChild(imgWrapper);
                    imgWrapper.onclick = () => {
                        // 移除同类型项目的选中状态
                        spriteLibrary.querySelectorAll('.sprite-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        // 添加当前项目的选中状态
                        imgWrapper.classList.add('selected');
                        
                        const img = new Image();
                        img.onload = () => {
                            this.addLayer({
                                type: 'sprite',
                                source: img,
                                x: 50,
                                y: 50,
                                width: 100,
                                height: 100,
                                zIndex: 1,
                                opacity: 1
                            });
                        };
                        img.src = `assets/sprites/${file}`;
                    };
                    spriteLibrary.appendChild(div);
                });
        });

        // 加载所有元素
        const elementFiles = ['example.svg', 'example copy.svg', 'example copy 2.svg'];
        elementFiles.forEach(file => {
            fetch(`assets/elements/${file}`)
                .then(response => response.text())
                .then(svgContent => {
                    const div = document.createElement('div');
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'element-item';
                    const img = document.createElement('img');
                    img.src = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
                    imgWrapper.appendChild(img);
                    div.appendChild(imgWrapper);
                    imgWrapper.onclick = () => {
                        // 移除同类型项目的选中状态
                        elementLibrary.querySelectorAll('.element-item').forEach(item => {
                            item.classList.remove('selected');
                        });
                        // 添加当前项目的选中状态
                        imgWrapper.classList.add('selected');
                        
                        const img = new Image();
                        img.onload = () => {
                            this.addLayer({
                                type: 'element',
                                source: img,
                                x: 100,
                                y: 100,
                                width: 80,
                                height: 80,
                                zIndex: 2,
                                opacity: 1
                            });
                        };
                        img.src = `assets/elements/${file}`;
                    };
                    elementLibrary.appendChild(div);
                });
        });
    }

    initTextLayerListeners() {
        console.log('Initializing text layer listeners...'); // 调试日志
        
        const textInput = document.getElementById('textInput');
        const fontSelect = document.getElementById('fontSelect');
        const fontSize = document.getElementById('fontSize');
        const textColor = document.getElementById('textColor');
        
        console.log('Text controls:', { // 调试日志
            textInput,
            fontSelect,
            fontSize,
            textColor
        });
        
        // 修改获取开关元素的方式
        const textLayerSwitch = document.querySelector('.bg-gray-50 .custom-switch input[type="checkbox"]');
        console.log('Text layer switch:', textLayerSwitch); // 调试日志

        if (!textInput || !fontSelect || !fontSize || !textColor || !textLayerSwitch) {
            console.error('Text layer controls not found');
            return;
        }

        const updateTextLayer = () => {
            console.log('Updating text layer...'); // 调试日志
            const text = textInput.value;
            console.log('Text input value:', text); // 调试日志
            console.log('Switch checked:', textLayerSwitch.checked); // 调试日志
            
            if (text && textLayerSwitch.checked) {
                // 查找现有的文字层或创建新的
                const textLayer = this.layers.find(layer => layer.type === 'text') || {};
                const updatedLayer = {
                    ...textLayer,
                    type: 'text',
                    content: text,
                    x: textLayer.x || this.canvas.width / 2,
                    y: textLayer.y || this.canvas.height / 2,
                    font: fontSelect.value,
                    size: parseInt(fontSize.value) || 16,
                    color: textColor.value || '#000000',
                    zIndex: textLayer.zIndex || 3
                };

                console.log('Adding text layer:', updatedLayer); // 调试日志
                this.addLayer(updatedLayer);
            } else {
                console.log('Removing text layer'); // 调试日志
                this.layers = this.layers.filter(layer => layer.type !== 'text');
                this.render();
            }
        };

        // 为所有输入控件添加事件监听
        const addListener = (element, events) => {
            events.forEach(event => {
                element.addEventListener(event, () => {
                    console.log(`${event} event triggered on`, element); // 调试日志
                    updateTextLayer();
                });
            });
        };

        addListener(textInput, ['input', 'change']);
        addListener(fontSelect, ['change']);
        addListener(fontSize, ['input', 'change']);
        addListener(textColor, ['input', 'change']);
        addListener(textLayerSwitch, ['change']);

        // 初始更新
        updateTextLayer();

        // 添加字体选项
        if (fontSelect) {
            // 清空现有选项
            fontSelect.innerHTML = '';
            
            // 添加默认字体
            const defaultFonts = ['Arial', 'Times New Roman', 'Microsoft YaHei'];
            defaultFonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font;
                option.textContent = font;
                fontSelect.appendChild(option);
            });
            
            // 添加自定义字体
            const customOption = document.createElement('option');
            customOption.value = '汉仪霸蛮体';
            customOption.textContent = '汉仪霸蛮体';
            fontSelect.appendChild(customOption);
        }
    }

    initDragListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleDragStart.bind(this));
        document.addEventListener('mousemove', this.handleDragMove.bind(this));
        document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleDragStart(e) {
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const x = (e.clientX - containerRect.left - this.offsetX) / this.scale;
        const y = (e.clientY - containerRect.top - this.offsetY) / this.scale;
        
        const clickedLayer = this.findLayerAtPosition(x, y);
        
        if (clickedLayer && clickedLayer.type !== 'bg') {
            // 开始拖动图层
            this.isDragging = true;
            this.isPanning = false;
            this.selectedLayer = clickedLayer;
            this.dragStartX = x - clickedLayer.x;
            this.dragStartY = y - clickedLayer.y;
            this.canvas.style.cursor = 'move';
        } else {
            // 开始平移画布
            this.isPanning = true;
            this.isDragging = false;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleDragMove(e) {
        if (this.isDragging && this.selectedLayer) {
            // 处理图层拖动
            const containerRect = this.canvasContainer.getBoundingClientRect();
            let newX = (e.clientX - containerRect.left - this.offsetX) / this.scale - this.dragStartX;
            let newY = (e.clientY - containerRect.top - this.offsetY) / this.scale - this.dragStartY;
            
            // 确保图层不会超出画布边界
            newX = Math.max(0, Math.min(newX, this.canvas.width - (this.selectedLayer.width || 0)));
            newY = Math.max(0, Math.min(newY, this.canvas.height - (this.selectedLayer.height || 0)));
            
            this.selectedLayer.x = newX;
            this.selectedLayer.y = newY;
            
            this.render();
        } else if (this.isPanning) {
            // 处理画布平移
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            // 计算新的偏移量
            const newOffsetX = this.offsetX + deltaX;
            const newOffsetY = this.offsetY + deltaY;
            
            // 计算缩放后的画布尺寸
            const scaledWidth = this.canvas.width * this.scale;
            const scaledHeight = this.canvas.height * this.scale;
            
            // 获取父容器尺寸
            const parentRect = this.canvasContainer.parentElement.getBoundingClientRect();
            
            // 计算最大允许的平移范围
            const maxOffsetX = Math.max(0, (scaledWidth - parentRect.width) / 2);
            const maxOffsetY = Math.max(0, (scaledHeight - parentRect.height) / 2);
            
            // 应用平移限制
            this.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX));
            this.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY));
            
            // 更新画布容器位置
            this.updateCanvasPosition();
        }
    }

    handleDragEnd() {
        if (this.isDragging) {
            this.isDragging = false;
            this.selectedLayer = null;
            this.canvas.style.cursor = 'default';
        }
        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'grab';
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const x = (touch.clientX - containerRect.left - this.offsetX) / this.scale;
        const y = (touch.clientY - containerRect.top - this.offsetY) / this.scale;
        
        const clickedLayer = this.findLayerAtPosition(x, y);
        
        if (clickedLayer && clickedLayer.type !== 'bg') {
            // 长按开始拖动图层
            this.longPressTimeout = setTimeout(() => {
                this.isDragging = true;
                this.isPanning = false;
                this.selectedLayer = clickedLayer;
                this.dragStartX = x - clickedLayer.x;
                this.dragStartY = y - clickedLayer.y;
            }, 500);
        } else {
            // 立即开始平移画布
            this.isPanning = true;
            this.isDragging = false;
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
        }
    }

    handleTouchMove(e) {
        if (this.isDragging && this.selectedLayer) {
            // 处理图层拖动
            const touch = e.touches[0];
            const containerRect = this.canvasContainer.getBoundingClientRect();
            let newX = (touch.clientX - containerRect.left - this.offsetX) / this.scale - this.dragStartX;
            let newY = (touch.clientY - containerRect.top - this.offsetY) / this.scale - this.dragStartY;
            
            // 确保图层不会超出画布边界
            newX = Math.max(0, Math.min(newX, this.canvas.width - (this.selectedLayer.width || 0)));
            newY = Math.max(0, Math.min(newY, this.canvas.height - (this.selectedLayer.height || 0)));
            
            this.selectedLayer.x = newX;
            this.selectedLayer.y = newY;
            
            this.render();
        } else if (this.isPanning) {
            // 处理画布平移
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.lastMouseX;
            const deltaY = touch.clientY - this.lastMouseY;
            
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
            
            // 计算新的偏移量
            const newOffsetX = this.offsetX + deltaX;
            const newOffsetY = this.offsetY + deltaY;
            
            // 计算缩放后的画布尺寸
            const scaledWidth = this.canvas.width * this.scale;
            const scaledHeight = this.canvas.height * this.scale;
            
            // 获取父容器尺寸
            const parentRect = this.canvasContainer.parentElement.getBoundingClientRect();
            
            // 计算最大允许的平移范围
            const maxOffsetX = Math.max(0, (scaledWidth - parentRect.width) / 2);
            const maxOffsetY = Math.max(0, (scaledHeight - parentRect.height) / 2);
            
            // 应用平移限制
            this.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newOffsetX));
            this.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newOffsetY));
            
            // 更新画布容器位置
            this.updateCanvasPosition();
        }
    }

    handleTouchEnd() {
        if (this.longPressTimeout) {
            clearTimeout(this.longPressTimeout);
        }
        this.isDragging = false;
        this.isPanning = false;
        this.selectedLayer = null;
    }

    findLayerAtPosition(x, y) {
        // 从上层向下查找，返回第一个包含该点的图层
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            if (layer.type === 'text') {
                // 文字层的点击检测
                const metrics = this.ctx.measureText(layer.content);
                const textHeight = layer.size;
                const textWidth = metrics.width;
                
                const hitBox = {
                    x: layer.x - textWidth / 2,
                    y: layer.y - textHeight / 2,
                    width: textWidth,
                    height: textHeight
                };
                
                if (x >= hitBox.x && x <= hitBox.x + hitBox.width &&
                    y >= hitBox.y && y <= hitBox.y + hitBox.height) {
                    return layer;
                }
            } else if (layer.type !== 'bg') {
                // 图片层的点击检测
                if (x >= layer.x && x <= layer.x + layer.width &&
                    y >= layer.y && y <= layer.y + layer.height) {
                    return layer;
                }
            }
        }
        return null;
    }

    addLayer(config) {
        // 如果是同类型的图层，替换原有图层
        const index = this.layers.findIndex(layer => layer.type === config.type);
        if (index !== -1) {
            this.layers[index] = config;
        } else {
            this.layers.push(config);
        }
        this.render();
    }

    render() {
        if (!this.ctx) {
            console.error('Canvas context not available');
            return;
        }
        
        // 保存当前上下文状态
        this.ctx.save();
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制白色背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 按zIndex排序并渲染
        this.layers.sort((a, b) => a.zIndex - b.zIndex).forEach(layer => {
            if (layer.type === 'text') {
                // 检查字体是否已加载
                const fontFamily = layer.font || 'Arial';
                
                // 设置文字渲染属性
                this.ctx.fillStyle = layer.color || '#000000';
                this.ctx.font = `${layer.size}px "${fontFamily}"`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                // 渲染文字
                this.ctx.fillText(layer.content, layer.x, layer.y);
                console.log('Rendered text:', { // 调试日志
                    content: layer.content,
                    position: `${layer.x},${layer.y}`,
                    style: this.ctx.font,
                    color: layer.color
                });
            } else if (layer.source) {
                try {
                    this.ctx.globalAlpha = layer.opacity || 1;
                    this.ctx.drawImage(layer.source, layer.x, layer.y, layer.width, layer.height);
                    this.ctx.globalAlpha = 1;
                } catch (error) {
                    console.error('Error rendering image layer:', error);
                }
            }
        });
        
        // 恢复上下文状态
        this.ctx.restore();
    }

    addToPreload(url) {
        if (!this.preloadQueue.has(url)) {
            const img = new Image();
            img.src = url;
            this.preloadQueue.add(url);
            return new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = reject;
            });
        }
    }

    // 导出合成结果
    exportImage() {
        return this.canvas.toDataURL('image/png');
    }

    // 加载自定义字体
    async loadCustomFonts() {
        const fonts = [
            { name: '汉仪霸蛮体', url: 'assets/fonts/汉仪霸蛮体_爱给网_aigei_com.ttf' }
        ];

        for (const font of fonts) {
            try {
                console.log(`开始加载字体: ${font.name}`); // 添加调试日志
                const fontFace = new FontFace(font.name, `url(${font.url})`);
                await fontFace.load();
                document.fonts.add(fontFace);
                this.loadedFonts.add(font.name);
                console.log(`字体加载成功: ${font.name}`);
                
                // 字体加载成功后重新渲染
                this.render();
            } catch (error) {
                console.error(`字体加载失败 ${font.name}:`, error);
            }
        }
    }

    initZoomListeners() {
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this));
    }

    handleZoom(e) {
        e.preventDefault();
        
        if (!this.canvasContainer) {
            console.error('Canvas container not found');
            return;
        }
        
        // 获取鼠标在容器上的位置
        const rect = this.canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // 计算新的缩放比例
        const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale + delta));
        
        // 如果缩放比例没有变化，直接返回
        if (newScale === this.scale) return;
        
        // 更新缩放比例
        this.scale = newScale;
        
        // 更新画布位置和缩放
        this.updateCanvasPosition();
        
        // 重新渲染画布
        this.render();
    }

    updateCanvasPosition() {
        if (!this.canvasContainer) return;
        
        // 应用平移和缩放变换
        this.canvasContainer.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
        this.canvasContainer.style.transformOrigin = 'center center';
    }
}

// 初始化图层管理器
document.addEventListener('DOMContentLoaded', () => {
    window.layerManager = new LayerManager();
});