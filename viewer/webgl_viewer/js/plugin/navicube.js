/*

Modify According to  https://github.com/xBimTeam/XbimWebUI && 
                     https://github.com/Ahmed-Abdelhak/WixBim

*/


/* Copyright (c) 2016, xBIM Team, Northumbria University. All rights reserved.

This javascript library is part of xBIM project. It is provided under the same
Common Development and Distribution License (CDDL) as the xBIM Toolkit. For
more information see http://www.openbim.org

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */



/*
* construct
* You can specify your own texture of the cube as an [Image](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/Image)
* object argumen in constructor. If you don't specify any image default texture will be used (you can also use this one and enhance it if you want):
* 
* ![Cube texture](cube_texture.png) 
*
* @param {Image} [image = null] - optional image to be used for a cube texture.
*/
function Navicube(image) {
    this._image = image;

    //6 faces
    //6面
    this.TOP = 1600000;
    this.BOTTOM = 1600001;
    this.LEFT = 1600002;
    this.RIGHT = 1600003;
    this.FRONT = 1600004;
    this.BACK = 1600005;

    //8 corners
    //8顶角
    this.TOP_LEFT_FRONT = 1600006;
    this.TOP_RIGHT_FRONT = 1600007;
    this.TOP_LEFT_BACK = 1600008;
    this.TOP_RIGHT_BACK = 1600009;
    this.BOTTOM_LEFT_FRONT = 1600010;
    this.BOTTOM_RIGHT_FRONT = 1600011;
    this.BOTTOM_LEFT_BACK = 1600012;
    this.BOTTOM_RIGHT_BACK = 1600013;

    //12 edges
    //12棱
    this.TOP_LEFT = 1600014;
    this.TOP_RIGHT = 1600015;
    this.TOP_FRONT = 1600016;
    this.TOP_BACK = 1600017;
    this.BOTTOM_LEFT = 1600018;
    this.BOTTOM_RIGHT = 1600019;
    this.BOTTOM_FRONT = 1600020;
    this.BOTTOM_BACK = 1600021;
    this.FRONT_RIGHT = 1600022;
    this.FRONT_LEFT = 1600023;
    this.BACK_RIGHT = 1600024;
    this.BACK_LEFT = 1600025;

    //初始化标志，默认为false
    this._initialized = false;

    /**
    * Size of the cube relative to the size of viewer canvas. This has to be a positive number between [0,1] Default value is 0.15. 
    * 相对于整个viewer的比率，控制cube的大小
    * @member {Number} Navicube#ratio
    */
    this.ratio = 0.1;

    /**
    * Active parts of the navigation cube are highlighted so that user can recognize which part is active. 
    * This should be a positive number between [0,2]. If the value is less than 1 active area is darker.
    * If the value is greater than 1 active area is lighter. Default value is 1.2. 
    * cube选中的高亮值
    * @member {Number} Navicube#highlighting
    */
    this.highlighting = 1.2;

    /**
    * Navigation cube has two transparency states. One is when user hovers over the cube and the second when the cursor is anywhere else.
    * This is for the hovering shate and it should be a positive number between [0,1]. If the value is less than 1 cube will be semitransparent 
    * when user hovers over. Default value is 1.0. 
    * hover状态下的透明度，1为不透明
    * @member {Number} Navicube#activeAlpha
    */
    this.activeAlpha = 1.0;

    /**
    * Navigation cube has two transparency states. One is when user hovers over the cube and the second when the cursor is anywhere else.
    * This is for the non-hovering shate and it should be a positive number between [0,1]. If the value is less than 1 cube will be semitransparent 
    * when user is not hovering over. Default value is 0.3. 
    * 非hover状态下的透明度，默认为0.3
    * @member {Number} Navicube#passiveAlpha
    */
    this.passiveAlpha = 0.3;

    /**
    * It is possible to place navigation cube to any of the corners of the canvas using this property. Default value is cube.BOTTOM_RIGHT. 
    * Allowed values are cube.BOTTOM_RIGHT, cube.BOTTOM_LEFT, cube.TOP_RIGHT and cube.TOP_LEFT.
    * @member {Enum} Navicube#position
    */
    this.position = this.TOP_RIGHT;
}

//#region init
Navicube.prototype.init = function (viewer) {

    var self = this;
    this.viewer = viewer;

    this._alpha = this.passiveAlpha;
    this._selection = 0.0;

    var gl = this.viewer._gl;
    this._shaderprogram = null;
    //初始化Shader，调用useprogram后即可对navicube中的变量进行赋值操作
    this._initShader();


    //get uniform location
    //获取vshader相关变量
    this.u_mvpMatrixPointer = gl.getUniformLocation(this._shaderprogram, "uMvpMatrix");
    this.u_pMatrixPointer = gl.getUniformLocation(this._shaderprogram, "uPMatrix");
    this.u_colourCodingPointer = gl.getUniformLocation(this._shaderprogram, "uColorCoding");
    this.u_selectionPointer = gl.getUniformLocation(this._shaderprogram, "uSelection");

    //feed data into the GPU and keep pointers
    //配置缓存区及对应变量
    //顶点
    this._vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    this.a_vertexPointer = gl.getAttribLocation(this._shaderprogram, "aVertex"),
    //开启变量a_vertexPointer
    gl.enableVertexAttribArray(this.a_vertexPointer); 

    //顶点索引
    this._indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    //方位ID
    this._idBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._idBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.ids(), gl.STATIC_DRAW);
    this.a_idPointer = gl.getAttribLocation(this._shaderprogram, "aId"),
    //开启变量a_vertexPointer
    gl.enableVertexAttribArray(this.a_idPointer);


//#region  坐标对应 + 图像加载
    
    //创建缓冲区，将顶点坐标和纹理坐标写入缓冲区对象
    this._texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.txtCoords, gl.STATIC_DRAW);
    //获取aTexCoord遍量
    //vshader:aTexCoord -> vshader:vTexCoord -> fshader:vTexCoord
    this.a_texCoordPointer = gl.getAttribLocation(this._shaderprogram, "aTexCoord"),
    //开启aTexCoord变量，链接该变量与_texCoordBuffer缓冲区
    gl.enableVertexAttribArray(this.a_texCoordPointer);


    /* load image texture into GPU
    *  如果我们使用了非2的n次方的图片(即图片的宽和高不是2的n次方)，会有下面的一些限制：
    *  不能使用MipMap映射；
    *  在着色器中采样纹理贴图时：纹理过滤方式只能用最近点或线性， 不能使用重复模式。
    * 
    *  此函数并未分配纹理单元，将在draw中完成该操作
    */
    var loadimage = function () {
        //由于WebGL纹理坐标系统中的t轴的方向和PNG、BMP、JPG等格式图片的坐标系的Y轴方向相反。因此，只有将图像的Y轴进行反转，才能够正确地将图像映射到图形上。
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        //绑定纹理对象
        gl.bindTexture(gl.TEXTURE_2D, self._texture);
        //配置纹理参数，均为默认
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        //配置纹理图像
        //如果纹理图片是JPG格式，该格式将每个像素用RGB三个分量表示，所以参数指定为gl.RGB。其他格式，例如PNG为gl.RGBA、BMP格式为gl.RGB。
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self._image);
        //使用mipmap纹理减少锯齿
        //优点：模型无论是远离还是离摄像机较近时，显示都会比较自然；渲染效率更高；
        //缺点：内存使用会增大为单张图片的1/3；
        gl.generateMipmap(gl.TEXTURE_2D);
    };

    //create texture
    this._texture = gl.createTexture();
    //fshader-用于接收透明度值
    this.u_alphaPointer = gl.getUniformLocation(this._shaderprogram, "uAlpha");
    //fshader-用于接收高亮值
    this.u_highlightingPointer = gl.getUniformLocation(this._shaderprogram, "uHighlighting");
    //fshader-用于接收纹理图像
    this.u_SamplerPointer = gl.getUniformLocation(this._shaderprogram, "uSampler");
    if (typeof (this._image) === "undefined") {
        //add HTML UI to viewer port
        var data = CubeTextures["en"];
        var image = new Image();
        self._image = image;
        //加载图像的过程是异步的，需要使用load监听事件
        image.addEventListener("load", function () {
            loadimage();
        });
        image.src = data;
    } else {
        loadimage();
    }

//#endregion 

    //注意这里切换到了viewer的shaderprogram
    gl.useProgram(this.viewer._shaderProgram);
    self._drag = false;

//#region mousemove function
    //监听viewer的鼠标移动事件
    viewer._canvas.addEventListener('mousemove', function (event) {
        startX = event.clientX;
        startY = event.clientY;

        //get coordinates within canvas (with the right orientation)
        var r = viewer._canvas.getBoundingClientRect();
        var viewX = startX - r.left;
        var viewY = viewer._height - (startY - r.top);

        //this is for picking
        //根据位置获取ID，也就是构造函数中的某一个方向枚举值
        var id = viewer._getID(viewX, viewY);

        if (id >= self.TOP && id <= self.BACK_LEFT) {
            self._alpha = self.activeAlpha;
            self._selection = id;
        } else {
            self._alpha = self.passiveAlpha;
            self._selection = 0;
        }
    }, true);


    //监听viewer的鼠标点击事件
    viewer._canvas.addEventListener('mousedown', function (event) {
        startX = event.clientX;
        startY = event.clientY;

        //get coordinates within canvas (with the right orientation)
        var r = viewer._canvas.getBoundingClientRect();
        var viewX = startX - r.left;
        var viewY = viewer._height - (startY - r.top);

        //this is for picking
        //根据位置获取ID，也就是构造函数中的某一个方向枚举值
        var id = viewer._getID(viewX, viewY);

        if (id >= self.TOP && id <= self.BACK_LEFT) {
            //change viewer navigation mode to be 'orbit'
            self._drag = true;
            self._originalNavigation = viewer.navigationMode;
            viewer.navigationMode = "orbit";
        }
    }, true);


    //监听viewer的鼠标抬起事件
    window.addEventListener('mouseup', function (event) {
        if (self._drag === true) {
            viewer.navigationMode = self._originalNavigation;
        }
        self._drag = false;
    }, true);

//#endregion

    //结束初始化
    this._initialized = true;
}
//#endregion


//#region initshader
Navicube.prototype._initShader = function () {

    //define compile function
    var gl = this.viewer._gl;
    var viewer = this.viewer;
    var compile = function (shader, code) {
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            viewer._error(gl.getShaderInfoLog(shader));
            return null;
        }
    }

    /*1. create shader
    / 2. shader source
    / 3. compile shader
    / 4. create program
    / 5. attach shader
    / 6. link program
    / 7. use program
    */

    //fragment shader
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    compile(fragmentShader, Shaders.cube_fshader);

    //vertex shader (the more complicated one)
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    compile(vertexShader, Shaders.cube_vshader);

    //link program
    this._shaderprogram = gl.createProgram();
    gl.attachShader(this._shaderprogram, vertexShader);
    gl.attachShader(this._shaderprogram, fragmentShader);
    gl.linkProgram(this._shaderprogram);

    if (!gl.getProgramParameter(this._shaderprogram, gl.LINK_STATUS)) {
        viewer._error('Could not initialise shaders for a navicube plugin');
    }

    //use program
    gl.useProgram(this._shaderprogram);
};
//#endregion


//viewer call this function
Navicube.prototype.onBeforeDraw = function () { };
Navicube.prototype.onAfterDraw = function () {
    var gl = this.setActive();
    gl.uniform1i(this.u_colourCodingPointer, 0);
    this.draw();
    this.setInactive();
};

Navicube.prototype.onBeforeDrawId = function () { };
Navicube.prototype.onAfterDrawId = function () {
    var gl = this.setActive();
    gl.uniform1i(this.u_colourCodingPointer, 1);
    this.draw();
    this.setInactive();
};

//navicube active
Navicube.prototype.setActive = function () {
    var gl = this.viewer._gl;
    //set own shader
    gl.useProgram(this._shaderprogram);
    return gl;
};

//viewer active
Navicube.prototype.setInactive = function () {
    var gl = this.viewer._gl;
    //set viewer shader
    gl.useProgram(this.viewer._shaderProgram);
};


//navicube draw
Navicube.prototype.draw = function () {
    if (!this._initialized) return;

    var gl = this.viewer._gl;

    //#region  
    //设置可视空间pMatrix，navicube不应该使用远小近大的透射投影perspective，而应该使用正射投影ortho 
    //(left - right - bottom - top - near - far)
    var pMatrix = mat4.create();
    var height = 1.0 / this.ratio;
    var width = height * this.viewer._width / this.viewer._height;

    //根据position的设置将cube的正交投影到相应位置
    //若要保持照相机的横纵比例，(right-left)与(top-bottom)的比例为1:1。
    switch (this.position) {

        //左上
        case this.TOP_LEFT:
            mat4.ortho(pMatrix,
                -1.0 * this.ratio * width, 
                (1.0 - this.ratio) * width,
                (this.ratio - 1.0) * height,
                this.ratio * height,
                -1, 
                1);
            break;

        //左下
        case this.BOTTOM_LEFT:
            mat4.ortho(pMatrix,
                -1.0 * this.ratio * width, 
                (1.0 - this.ratio) * width,
                this.ratio * -1.0 * height,
                (1.0 - this.ratio) * height, 
                -1,
                1);
            break;
            
        //右上
        case this.TOP_RIGHT:
            mat4.ortho(pMatrix,
                (this.ratio - 1.0) * width, 
                this.ratio * width,
                (this.ratio - 1.0) * height,
                this.ratio * height,
                -1,
                1);
            break;

        //右下
        case this.BOTTOM_RIGHT:
            mat4.ortho(pMatrix,
                (this.ratio - 1.0) * width, 
                this.ratio * width, 
                this.ratio * -1.0 * height, 
                (1.0 - this.ratio) * height, 
                -1, 
                1);
            break;
        default:
    }

    //正交投影矩阵
    gl.uniformMatrix4fv(this.u_pMatrixPointer, false, pMatrix);
    //模型视图矩阵 即：视角(视图矩阵) *  平移/缩放/旋转(模型矩阵)
    var mvpMatrix = mat3.fromMat4(mat3.create(), this.viewer._mvMatrix);
    gl.uniformMatrix3fv(this.u_mvpMatrixPointer, false, mvpMatrix);
    //#endregion


    //cube alpha
    gl.uniform1f(this.u_alphaPointer, this._alpha);
    //highlight
    gl.uniform1f(this.u_highlightingPointer, this.highlighting);
    //cube direction selection
    gl.uniform1f(this.u_selectionPointer, this._selection);



    //bind data buffers （之前已经开启了）
    //将缓冲区_vertexBuffer中的数据赋给a_vertexPointer
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.vertexAttribPointer(this.a_vertexPointer, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._idBuffer);
    //将缓冲区_idBuffer中的数据赋给a_idPointer
    gl.vertexAttribPointer(this.a_idPointer, 1, gl.FLOAT, false, 0, 0);

    //#region 纹理处理
    gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
    //将缓冲区_texCoordBuffer中的数据赋给a_texCoordPointer
    gl.vertexAttribPointer(this.a_texCoordPointer, 2, gl.FLOAT, false, 0, 0);
    //激活0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.uniform1i(this.u_SamplerPointer, 0);
    //#endregion


    //指定正面和/或背面多边形是否可以剔除（默认背面），此处应该开启剔除
    var cfEnabled = gl.getParameter(gl.CULL_FACE);
    if (!cfEnabled) gl.enable(gl.CULL_FACE);

    //绘制cube
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    //对每个索引值依次操作，绘制三角面
    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

    //关闭剔除
    if (!cfEnabled) gl.disable(gl.CULL_FACE);
};


//mouse pick cube
Navicube.prototype.onBeforePick = function (id) {
    if (id >= this.TOP && id <= this.BACK_LEFT) {

        var dir = vec3.create();
        var distance = this.viewer._distance;
        //如果非正面视角，让物体增加些距离感，故乘以一个系数
        var diagonalRatio = 1.3;

        switch (id) {
            case this.TOP:
                this.viewer.show('top');
                return true;
            case this.BOTTOM:
                this.viewer.show('bottom');
                return true;
            case this.LEFT:
                this.viewer.show('left');
                return true;
            case this.RIGHT:
                this.viewer.show('right');
                return true;
            case this.FRONT:
                this.viewer.show('front');
                return true;
            case this.BACK:
                this.viewer.show('back');
                return true;

            case this.TOP_LEFT_FRONT:
                dir = vec3.fromValues(-1, -1, 1);
                distance *= diagonalRatio;
                break;
            case this.TOP_RIGHT_FRONT:
                dir = vec3.fromValues(1, -1, 1);
                distance *= diagonalRatio;
                break;
            case this.TOP_LEFT_BACK:
                dir = vec3.fromValues(-1, 1, 1);
                distance *= diagonalRatio;
                break;
            case this.TOP_RIGHT_BACK:
                dir = vec3.fromValues(1, 1, 1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_LEFT_FRONT:
                dir = vec3.fromValues(-1, -1, -1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_RIGHT_FRONT:
                dir = vec3.fromValues(1, -1, -1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_LEFT_BACK:
                dir = vec3.fromValues(-1, 1, -1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_RIGHT_BACK:
                dir = vec3.fromValues(1, 1, -1);
                distance *= diagonalRatio;
                break;
            case this.TOP_LEFT:
                dir = vec3.fromValues(-1, 0, 1);
                distance *= diagonalRatio;
                break;
            case this.TOP_RIGHT:
                dir = vec3.fromValues(1, 0, 1);
                distance *= diagonalRatio;
                break;
            case this.TOP_FRONT:
                dir = vec3.fromValues(0, -1, 1);
                distance *= diagonalRatio;
                break;
            case this.TOP_BACK:
                dir = vec3.fromValues(0, 1, 1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_LEFT:
                dir = vec3.fromValues(-1, 0, -1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_RIGHT:
                dir = vec3.fromValues(1, 0, -1);
                break;
            case this.BOTTOM_FRONT:
                dir = vec3.fromValues(0, -1, -1);
                distance *= diagonalRatio;
                break;
            case this.BOTTOM_BACK:
                dir = vec3.fromValues(0, 1, -1);
                distance *= diagonalRatio;
                break;
            case this.FRONT_RIGHT:
                dir = vec3.fromValues(1, -1, 0);
                distance *= diagonalRatio;
                break;
            case this.FRONT_LEFT:
                dir = vec3.fromValues(-1, -1, 0);
                distance *= diagonalRatio;
                break;
            case this.BACK_RIGHT:
                dir = vec3.fromValues(1, 1, 0);
                distance *= diagonalRatio;
                break;
            case this.BACK_LEFT:
                dir = vec3.fromValues(-1, 1, 0);
                distance *= diagonalRatio;
                break;
            default:
                break;
        }

        var o = this.viewer._origin;
        var origin = vec3.fromValues(o[0], o[1], o[2]);

        dir = vec3.normalize(vec3.create(), dir);
        var shift = vec3.scale(vec3.create(), dir, distance);
        var camera = vec3.add(vec3.create(), origin, shift);

        //初始化的时候Front面在底部，所以上方向是躺着的，即(0,0,1)
        var heading = vec3.fromValues(0, 0, 1);
        mat4.lookAt(this.viewer._mvMatrix, camera, origin, heading);
        return true;
    }
    return false;
};


//#region  放入缓冲区的数据 
//顶点
Navicube.prototype.vertices = new Float32Array([

    //#region 单面是4个点
    // Front face
    /*    0 ____1
     *     /   /
     *   3/___/2
    */
    -0.3, -0.5, -0.3,
    0.3, -0.5, -0.3,
    0.3, -0.5, 0.3,
    -0.3, -0.5, 0.3,

    // Back face
    -0.3, 0.5, -0.3,
    -0.3, 0.5, 0.3,
    0.3, 0.5, 0.3,
    0.3, 0.5, -0.3,


    // Top face
    -0.3, -0.3, 0.5,
    0.3, -0.3, 0.5,
    0.3, 0.3, 0.5,
    -0.3, 0.3, 0.5,

    // Bottom face
    -0.3, -0.3, -0.5,
    -0.3, 0.3, -0.5,
    0.3, 0.3, -0.5,
    0.3, -0.3, -0.5,

    // Right face
    0.5, -0.3, -0.3,
    0.5, 0.3, -0.3,
    0.5, 0.3, 0.3,
    0.5, -0.3, 0.3,

    // Left face
    -0.5, -0.3, -0.3,
    -0.5, -0.3, 0.3,
    -0.5, 0.3, 0.3,
    -0.5, 0.3, -0.3,
    //#endregion
     
    //#region 顶角12个点 即： 一共3个面，每个面4个点
    //top - left - front (--+)
    -0.5, -0.5, 0.5,
    -0.3, -0.5, 0.5,
    -0.3, -0.3, 0.5,
    -0.5, -0.3, 0.5,

    -0.5, -0.5, 0.3,
    -0.5, -0.5, 0.5,
    -0.5, -0.3, 0.5,
    -0.5, -0.3, 0.3,

    -0.5, -0.5, 0.3,
    -0.3, -0.5, 0.3,
    -0.3, -0.5, 0.5,
    -0.5, -0.5, 0.5,

    //top-right-front (+-+)
    0.3, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, -0.3, 0.5,
    0.3, -0.3, 0.5,

    0.5, -0.5, 0.3,
    0.5, -0.3, 0.3,
    0.5, -0.3, 0.5,
    0.5, -0.5, 0.5,

    0.3, -0.5, 0.3,
    0.5, -0.5, 0.3,
    0.5, -0.5, 0.5,
    0.3, -0.5, 0.5,

    //top-left-back (-++)
    -0.5, 0.3, 0.5,
    -0.3, 0.3, 0.5,
    -0.3, 0.5, 0.5,
    -0.5, 0.5, 0.5,

    -0.5, 0.3, 0.3,
    -0.5, 0.3, 0.5,
    -0.5, 0.5, 0.5,
    -0.5, 0.5, 0.3,

    -0.5, 0.5, 0.3,
    -0.5, 0.5, 0.5,
    -0.3, 0.5, 0.5,
    -0.3, 0.5, 0.3,

    //top-right-back (+++)
    0.3, 0.3, 0.5,
    0.5, 0.3, 0.5,
    0.5, 0.5, 0.5,
    0.3, 0.5, 0.5,

    0.5, 0.3, 0.3,
    0.5, 0.5, 0.3,
    0.5, 0.5, 0.5,
    0.5, 0.3, 0.5,

    0.3, 0.5, 0.3,
    0.3, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, 0.3,

    //bottom - left - front (---)
    -0.5, -0.5, -0.5,
    -0.3, -0.5, -0.5,
    -0.3, -0.3, -0.5,
    -0.5, -0.3, -0.5,

    -0.5, -0.5, -0.5,
    -0.5, -0.5, -0.3,
    -0.5, -0.3, -0.3,
    -0.5, -0.3, -0.5,

    -0.5, -0.5, -0.5,
    -0.3, -0.5, -0.5,
    -0.3, -0.5, -0.3,
    -0.5, -0.5, -0.3,

    //bottom-right-front (+--)
    0.3, -0.5, -0.5,
    0.5, -0.5, -0.5,
    0.5, -0.3, -0.5,
    0.3, -0.3, -0.5,

    0.5, -0.5, -0.5,
    0.5, -0.3, -0.5,
    0.5, -0.3, -0.3,
    0.5, -0.5, -0.3,

    0.3, -0.5, -0.5,
    0.5, -0.5, -0.5,
    0.5, -0.5, -0.3,
    0.3, -0.5, -0.3,

    //bottom-left-back (-+-)
    -0.5, 0.3, -0.5,
    -0.3, 0.3, -0.5,
    -0.3, 0.5, -0.5,
    -0.5, 0.5, -0.5,

    -0.5, 0.3, -0.5,
    -0.5, 0.3, -0.3,
    -0.5, 0.5, -0.3,
    -0.5, 0.5, -0.5,

    -0.5, 0.5, -0.5,
    -0.5, 0.5, -0.3,
    -0.3, 0.5, -0.3,
    -0.3, 0.5, -0.5,

    //bottom-right-back (++-)
    0.3, 0.3, -0.5,
    0.5, 0.3, -0.5,
    0.5, 0.5, -0.5,
    0.3, 0.5, -0.5,

    0.5, 0.3, -0.5,
    0.5, 0.5, -0.5,
    0.5, 0.5, -0.3,
    0.5, 0.3, -0.3,

    0.3, 0.5, -0.5,
    0.3, 0.5, -0.3,
    0.5, 0.5, -0.3,
    0.5, 0.5, -0.5,
    //#endregion

    //#region 边棱8个点 即： 一共2个面，每个面4个点
    //top-right (+0+)
    0.3, -0.3, 0.5,
    0.5, -0.3, 0.5,
    0.5, 0.3, 0.5,
    0.3, 0.3, 0.5,

    0.5, -0.3, 0.3,
    0.5, 0.3, 0.3,
    0.5, 0.3, 0.5,
    0.5, -0.3, 0.5,

    //top-left (-0+)
    -0.5, -0.3, 0.5,
    -0.3, -0.3, 0.5,
    -0.3, 0.3, 0.5,
    -0.5, 0.3, 0.5,

    -0.5, -0.3, 0.3,
    -0.5, -0.3, 0.5,
    -0.5, 0.3, 0.5,
    -0.5, 0.3, 0.3,

    //top-front (0-+)
    -0.3, -0.5, 0.5,
    0.3, -0.5, 0.5,
    0.3, -0.3, 0.5,
    -0.3, -0.3, 0.5,

    -0.3, -0.5, 0.3,
    0.3, -0.5, 0.3,
    0.3, -0.5, 0.5,
    -0.3, -0.5, 0.5,

    //top-back (0++)
    -0.3, 0.3, 0.5,
    0.3, 0.3, 0.5,
    0.3, 0.5, 0.5,
    -0.3, 0.5, 0.5,

    -0.3, 0.5, 0.3,
    -0.3, 0.5, 0.5,
    0.3, 0.5, 0.5,
    0.3, 0.5, 0.3,

    //bottom-right (+0-)
    0.3, -0.3, -0.5,
    0.5, -0.3, -0.5,
    0.5, 0.3, -0.5,
    0.3, 0.3, -0.5,

    0.5, -0.3, -0.5,
    0.5, 0.3, -0.5,
    0.5, 0.3, -0.3,
    0.5, -0.3, -0.3,

    //bottom-left (-0-)
    -0.5, -0.3, -0.5,
    -0.5, 0.3, -0.5,
    -0.3, 0.3, -0.5,
    -0.3, -0.3, -0.5,

    -0.5, -0.3, -0.5,
    -0.5, -0.3, -0.3,
    -0.5, 0.3, -0.3,
    -0.5, 0.3, -0.5,

    //bottom-front (0--)
    -0.3, -0.5, -0.5,
    0.3, -0.5, -0.5,
    0.3, -0.3, -0.5,
    -0.3, -0.3, -0.5,

    -0.3, -0.5, -0.5,
    0.3, -0.5, -0.5,
    0.3, -0.5, -0.3,
    -0.3, -0.5, -0.3,

    //bottom-back (0+-)
    -0.3, 0.3, -0.5,
    0.3, 0.3, -0.5,
    0.3, 0.5, -0.5,
    -0.3, 0.5, -0.5,

    -0.3, 0.5, -0.5,
    -0.3, 0.5, -0.3,
    0.3, 0.5, -0.3,
    0.3, 0.5, -0.5,

    //front-right (+-0)
    0.3, -0.5, -0.3,
    0.5, -0.5, -0.3,
    0.5, -0.5, 0.3,
    0.3, -0.5, 0.3,

    0.5, -0.5, -0.3,
    0.5, -0.3, -0.3,
    0.5, -0.3, 0.3,
    0.5, -0.5, 0.3,

    //front-left (--0)
    -0.5, -0.5, -0.3,
    -0.3, -0.5, -0.3,
    -0.3, -0.5, 0.3,
    -0.5, -0.5, 0.3,

    -0.5, -0.5, -0.3,
    -0.5, -0.5, 0.3,
    -0.5, -0.3, 0.3,
    -0.5, -0.3, -0.3,

    //back-right (++0)
    0.3, 0.5, -0.3,
    0.3, 0.5, 0.3,
    0.5, 0.5, 0.3,
    0.5, 0.5, -0.3,

    0.5, 0.3, -0.3,
    0.5, 0.5, -0.3,
    0.5, 0.5, 0.3,
    0.5, 0.3, 0.3,

    //back-left (-+0)
    -0.5, 0.5, -0.3,
    -0.5, 0.5, 0.3,
    -0.3, 0.5, 0.3,
    -0.3, 0.5, -0.3,

    -0.5, 0.3, -0.3,
    -0.5, 0.3, 0.3,
    -0.5, 0.5, 0.3,
    -0.5, 0.5, -0.3,
    //#endregion
]);


//顶点索引
Navicube.prototype.indices = new Uint16Array([

    //#region 6个面
    0, 1, 2, 0, 2, 3, // Front face
    4, 5, 6, 4, 6, 7, // Back face
    8, 9, 10, 8, 10, 11, // Top face
    12, 13, 14, 12, 14, 15, // Bottom face
    16, 17, 18, 16, 18, 19, // Right face
    20, 21, 22, 20, 22, 23, // Left face
    //#endregion

    //#region 6个面 * 每个面4个点 = 24， 所以偏移24
    //top - left - front 
    0 + 24, 1 + 24, 2 + 24, 0 + 24, 2 + 24, 3 + 24,
    4 + 24, 5 + 24, 6 + 24, 4 + 24, 6 + 24, 7 + 24,
    8 + 24, 9 + 24, 10 + 24, 8 + 24, 10 + 24, 11 + 24,
    //#endregion

    //#region 偏移12个点
    //top-right-front 
    0 + 36, 1 + 36, 2 + 36, 0 + 36, 2 + 36, 3 + 36,
    4 + 36, 5 + 36, 6 + 36, 4 + 36, 6 + 36, 7 + 36,
    8 + 36, 9 + 36, 10 + 36, 8 + 36, 10 + 36, 11 + 36,

    //top-left-back 
    0 + 48, 1 + 48, 2 + 48, 0 + 48, 2 + 48, 3 + 48,
    4 + 48, 5 + 48, 6 + 48, 4 + 48, 6 + 48, 7 + 48,
    8 + 48, 9 + 48, 10 + 48, 8 + 48, 10 + 48, 11 + 48,

    //top-right-back
    0 + 60, 1 + 60, 2 + 60, 0 + 60, 2 + 60, 3 + 60,
    4 + 60, 5 + 60, 6 + 60, 4 + 60, 6 + 60, 7 + 60,
    8 + 60, 9 + 60, 10 + 60, 8 + 60, 10 + 60, 11 + 60,

    //bottom - left - front
    0 + 72, 2 + 72, 1 + 72, 0 + 72, 3 + 72, 2 + 72,
    4 + 72, 5 + 72, 6 + 72, 4 + 72, 6 + 72, 7 + 72,
    8 + 72, 9 + 72, 10 + 72, 8 + 72, 10 + 72, 11 + 72,

    //bottom-right-front 
    0 + 84, 2 + 84, 1 + 84, 0 + 84, 3 + 84, 2 + 84,
    4 + 84, 5 + 84, 6 + 84, 4 + 84, 6 + 84, 7 + 84,
    8 + 84, 9 + 84, 10 + 84, 8 + 84, 10 + 84, 11 + 84,

    //bottom-left-back 
    0 + 96, 2 + 96, 1 + 96, 0 + 96, 3 + 96, 2 + 96,
    4 + 96, 5 + 96, 6 + 96, 4 + 96, 6 + 96, 7 + 96,
    8 + 96, 9 + 96, 10 + 96, 8 + 96, 10 + 96, 11 + 96,

    //bottom-right-back
    0 + 108, 2 + 108, 1 + 108, 0 + 108, 3 + 108, 2 + 108,
    4 + 108, 5 + 108, 6 + 108, 4 + 108, 6 + 108, 7 + 108,
    8 + 108, 9 + 108, 10 + 108, 8 + 108, 10 + 108, 11 + 108,

    //top-right
    0 + 120, 1 + 120, 2 + 120, 0 + 120, 2 + 120, 3 + 120,
    4 + 120, 5 + 120, 6 + 120, 4 + 120, 6 + 120, 7 + 120,
    //#endregion

    //#region 偏移8个点
    //top-left
    0 + 128, 1 + 128, 2 + 128, 0 + 128, 2 + 128, 3 + 128,
    4 + 128, 5 + 128, 6 + 128, 4 + 128, 6 + 128, 7 + 128,

    //top-front
    0 + 136, 1 + 136, 2 + 136, 0 + 136, 2 + 136, 3 + 136,
    4 + 136, 5 + 136, 6 + 136, 4 + 136, 6 + 136, 7 + 136,

    //top-back
    0 + 144, 1 + 144, 2 + 144, 0 + 144, 2 + 144, 3 + 144,
    4 + 144, 5 + 144, 6 + 144, 4 + 144, 6 + 144, 7 + 144,

    //bottom-right
    0 + 152, 2 + 152, 1 + 152, 0 + 152, 3 + 152, 2 + 152,
    4 + 152, 5 + 152, 6 + 152, 4 + 152, 6 + 152, 7 + 152,

    //bottom-left
    0 + 160, 1 + 160, 2 + 160, 0 + 160, 2 + 160, 3 + 160,
    4 + 160, 5 + 160, 6 + 160, 4 + 160, 6 + 160, 7 + 160,

    //bottom-front
    0 + 168, 2 + 168, 1 + 168, 0 + 168, 3 + 168, 2 + 168,
    4 + 168, 5 + 168, 6 + 168, 4 + 168, 6 + 168, 7 + 168,

    //bottom-back
    0 + 176, 2 + 176, 1 + 176, 0 + 176, 3 + 176, 2 + 176,
    4 + 176, 5 + 176, 6 + 176, 4 + 176, 6 + 176, 7 + 176,

    //front-right
    0 + 184, 1 + 184, 2 + 184, 0 + 184, 2 + 184, 3 + 184,
    4 + 184, 5 + 184, 6 + 184, 4 + 184, 6 + 184, 7 + 184,

    //front-left
    0 + 192, 1 + 192, 2 + 192, 0 + 192, 2 + 192, 3 + 192,
    4 + 192, 5 + 192, 6 + 192, 4 + 192, 6 + 192, 7 + 192,

    //back-right
    0 + 200, 1 + 200, 2 + 200, 0 + 200, 2 + 200, 3 + 200,
    4 + 200, 5 + 200, 6 + 200, 4 + 200, 6 + 200, 7 + 200,

    //back-left
    0 + 208, 1 + 208, 2 + 208, 0 + 208, 2 + 208, 3 + 208,
    4 + 208, 5 + 208, 6 + 208, 4 + 208, 6 + 208, 7 + 208,
    //#endregion
]);


//纹理坐标
Navicube.prototype.txtCoords = new Float32Array([
    // Front face
    1.0 / 3.0 + 1.0 / 15.0, 0.0 / 3.0 + 1.0 / 15.0,
    2.0 / 3.0 - 1.0 / 15.0, 0.0 / 3.0 + 1.0 / 15.0,
    2.0 / 3.0 - 1.0 / 15.0, 1.0 / 3.0 - 1.0 / 15.0,
    1.0 / 3.0 + 1.0 / 15.0, 1.0 / 3.0 - 1.0 / 15.0,

    // Back face
    1.0 - 1.0 / 15.0, 0.0 / 3.0 + 1.0 / 15.0,
    1.0 - 1.0 / 15.0, 1.0 / 3.0 - 1.0 / 15.0,
    2.0 / 3.0 + 1.0 / 15.0, 1.0 / 3.0 - 1.0 / 15.0,
    2.0 / 3.0 + 1.0 / 15.0, 0.0 / 3.0 + 1.0 / 15.0,


    // Top face
    2.0 / 3.0 + 1.0 / 15.0, 1.0 / 3.0 + 1.0 / 15.0,
    1.0 - 1.0 / 15.0, 1.0 / 3.0 + 1.0 / 15.0,
    1.0 - 1.0 / 15.0, 2.0 / 3.0 - 1.0 / 15.0,
    2.0 / 3.0 + 1.0 / 15.0, 2.0 / 3.0 - 1.0 / 15.0,

    // Bottom face
    0.0 + 1.0 / 15.0, 1.0 / 3.0 - 1.0 / 15.0,
    0.0 + 1.0 / 15.0, 0.0 / 3.0 + 1.0 / 15.0,
    1.0 / 3.0 - 1.0 / 15.0, 0.0 / 3.0 + 1.0 / 15.0,
    1.0 / 3.0 - 1.0 / 15.0, 1.0 / 3.0 - 1.0 / 15.0,

    // Right face
    0.0 + 1.0 / 15.0, 1.0 / 3.0 + 1.0 / 15.0,
    1.0 / 3.0 - 1.0 / 15.0, 1.0 / 3.0 + 1.0 / 15.0,
    1.0 / 3.0 - 1.0 / 15.0, 2.0 / 3.0 - 1.0 / 15.0,
    0.0 + 1.0 / 15.0, 2.0 / 3.0 - 1.0 / 15.0,

    // Left face
    2.0 / 3.0 - 1.0 / 15.0, 1.0 / 3.0 + 1.0 / 15.0,
    2.0 / 3.0 - 1.0 / 15.0, 2.0 / 3.0 - 1.0 / 15.0,
    1.0 / 3.0 + 1.0 / 15.0, 2.0 / 3.0 - 1.0 / 15.0,
    1.0 / 3.0 + 1.0 / 15.0, 1.0 / 3.0 + 1.0 / 15.0,

    //top - left - front 
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //top-right-front 
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //top-left-back 
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //top-right-back 
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //bottom - left - front 
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //bottom-right-front 
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,

    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //bottom-left-back 
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,

    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //bottom-right-back 
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 30.0,

    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 1.0 / 30.0, 1.0 / 30.0,

    //top-right
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //top-left
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //top-front
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    //top-back
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    //bottom-right
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,

    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //bottom-left
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,

    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //bottom-front
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,

    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    //bottom-back
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 30.0,

    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    //front-right
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //front-left
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //back-right
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

    //back-left
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,
    2.0 / 3.0 + 2.0 / 30.0, 1.0 / 30.0,

    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,
    1.0 / 3.0 + 2.0 / 30.0, 1.0 / 3.0 + 1.0 / 30.0,

]);


//对应顶点坐标的点得到ID
Navicube.prototype.ids = function () {
    return new Float32Array([

        this.FRONT, // Front face
        this.FRONT,
        this.FRONT,
        this.FRONT,

        this.BACK, // Back face
        this.BACK,
        this.BACK,
        this.BACK,

        this.TOP, // Top face
        this.TOP,
        this.TOP,
        this.TOP,

        this.BOTTOM, // Bottom face
        this.BOTTOM,
        this.BOTTOM,
        this.BOTTOM,

        this.RIGHT, // Right face
        this.RIGHT,
        this.RIGHT,
        this.RIGHT,

        this.LEFT, // Left face
        this.LEFT,
        this.LEFT,
        this.LEFT,

        
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,
        this.TOP_LEFT_FRONT,

        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,
        this.TOP_RIGHT_FRONT,

        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,
        this.TOP_LEFT_BACK,

        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,
        this.TOP_RIGHT_BACK,

        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,
        this.BOTTOM_LEFT_FRONT,

        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,
        this.BOTTOM_RIGHT_FRONT,

        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,
        this.BOTTOM_LEFT_BACK,

        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,
        this.BOTTOM_RIGHT_BACK,

        this.TOP_RIGHT,
        this.TOP_RIGHT,
        this.TOP_RIGHT,
        this.TOP_RIGHT,
        this.TOP_RIGHT,
        this.TOP_RIGHT,
        this.TOP_RIGHT,
        this.TOP_RIGHT,

        this.TOP_LEFT,
        this.TOP_LEFT,
        this.TOP_LEFT,
        this.TOP_LEFT,
        this.TOP_LEFT,
        this.TOP_LEFT,
        this.TOP_LEFT,
        this.TOP_LEFT,

        this.TOP_FRONT,
        this.TOP_FRONT,
        this.TOP_FRONT,
        this.TOP_FRONT,
        this.TOP_FRONT,
        this.TOP_FRONT,
        this.TOP_FRONT,
        this.TOP_FRONT,

        this.TOP_BACK,
        this.TOP_BACK,
        this.TOP_BACK,
        this.TOP_BACK,
        this.TOP_BACK,
        this.TOP_BACK,
        this.TOP_BACK,
        this.TOP_BACK,

        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        this.BOTTOM_RIGHT,
        
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,
        this.BOTTOM_LEFT,

        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,
        this.BOTTOM_FRONT,

        this.BOTTOM_BACK,
        this.BOTTOM_BACK,
        this.BOTTOM_BACK,
        this.BOTTOM_BACK,
        this.BOTTOM_BACK,
        this.BOTTOM_BACK,
        this.BOTTOM_BACK,
        this.BOTTOM_BACK,

        this.FRONT_RIGHT,
        this.FRONT_RIGHT,
        this.FRONT_RIGHT,
        this.FRONT_RIGHT,
        this.FRONT_RIGHT,
        this.FRONT_RIGHT,
        this.FRONT_RIGHT,
        this.FRONT_RIGHT,

        this.FRONT_LEFT,
        this.FRONT_LEFT,
        this.FRONT_LEFT,
        this.FRONT_LEFT,
        this.FRONT_LEFT,
        this.FRONT_LEFT,
        this.FRONT_LEFT,
        this.FRONT_LEFT,

        this.BACK_RIGHT,
        this.BACK_RIGHT,
        this.BACK_RIGHT,
        this.BACK_RIGHT,
        this.BACK_RIGHT,
        this.BACK_RIGHT,
        this.BACK_RIGHT,
        this.BACK_RIGHT,
        
        this.BACK_LEFT,
        this.BACK_LEFT,
        this.BACK_LEFT,
        this.BACK_LEFT,
        this.BACK_LEFT,
        this.BACK_LEFT,
        this.BACK_LEFT,
        this.BACK_LEFT,
    ]);
};

//#endregion