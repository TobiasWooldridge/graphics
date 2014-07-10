var gl;

var Graphics = function Graphics() {
    var canvas;

    var shaderProgram;
    var mvMatrix = mat4.create();
    var perspectiveMatrix = mat4.create();

    var entities = [];
    var textures = {};

    var cameraAngle;
    var cameraPosition;

    var focus;

    var blending;

    function initWebGL() {
        gl = null;

        try {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        }
        catch (e) {
        }

        if (!gl) {
            alert("Unable to initialize WebGL. Your browser may not support it.");
            throw "Unable to initialize WebGL";
        }
    }

    function updatePerspectiveMatrix() {
        var fieldOfView = 45;
        var aspectRatio = canvas.width / canvas.height;
        var minRenderDistance = 0.1;
        var maxRenderDistance = 200;

        mat4.perspective(perspectiveMatrix, fieldOfView, aspectRatio, minRenderDistance, maxRenderDistance);
        gl.uniformMatrix4fv(shaderProgram.pUniform, false, new Float32Array(perspectiveMatrix));
    }

    function draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        loadCameraMatrix();
        mvTranslate(focus.position.map(function (x) {
            return -1 * x;
        }));


        if (blending) {
            function getFinalPosition(pos) {
                var mv = mat4.translate(mat4.create(), mvMatrix, pos);
                var vec = mat4.mul(mat4.create(), perspectiveMatrix, mv);
                return vec.subarray(12, 15);
            }

            entities.sort(function (a, b) {
                var ad = vec3.squaredLength(getFinalPosition(a.position));
                var bd = vec3.squaredLength(getFinalPosition(b.position));

                return bd - ad;
            });
        }

        var model, oldModel;
        var texture, oldTexture;
        var tint;

        // Draw all entities

        for (var entityIndex = 0; entityIndex < entities.length; entityIndex++) {
            var entity = entities[entityIndex];

            model = entity.model;
            texture = entity.texture;

            mvScope(function renderEntity() {
                if (model != oldModel) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, entity.vertexBuffer);
                    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, entity.normalBuffer);
                    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ARRAY_BUFFER, entity.textureCoordBuffer);
                    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, entity.vertexIndexBuffer);
                }

                if (texture != oldTexture) {
                    // TODO: Use texture units effectively
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.uniform1i(shaderProgram.samplerUniform, 0);
                }

                tint = entity.tint.slice();

                if (entity.sharedProperties.colliding > 0) {
                    var glow = Math.max(entity.sharedProperties.colliding, 1) / 100;
                    tint[0] += glow;
                    tint[1] -= glow / 2;
                    tint[2] -= glow / 2;
                }

                gl.uniform4f(shaderProgram.tintUniform, tint[0], tint[1], tint[2], blending ? tint[3] : 1);
                gl.uniform1f(shaderProgram.shinyUniform, entity.shininess);

                mvTranslate(entity.position);
                setMatrixUniforms();
                gl.drawElements(gl.TRIANGLES, entity.triangles * 3, gl.UNSIGNED_SHORT, 0);
            });

            oldModel = model;
            oldTexture = texture;
        }
    }

    function loadCameraMatrix() {
        mat4.identity(mvMatrix);

        mvTranslate(cameraPosition);
        mvRotate(cameraAngle[0], [1, 0, 0]);
        mvRotate(cameraAngle[1], [0, 1, 0]);
        mvRotate(cameraAngle[2], [0, 0, 1]);

        return mvMatrix;
    }

    function getCameraAngle() {
        return cameraAngle;
    }

    function initShaders() {
        var fragmentShader = getShader(gl, "blinnPhong-fs");
        var vertexShader = getShader(gl, "blinnPhong-vs");

        // Create the shader program
        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Unable to initialize the shader program.");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.tintUniform = gl.getUniformLocation(shaderProgram, "uTint");
        shaderProgram.shinyUniform = gl.getUniformLocation(shaderProgram, "uShiny");

        shaderProgram.pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");
    }

    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);

        // Didn't find an element with the specified ID; abort.
        if (!shaderScript) {
            return null;
        }

        // Walk through the source element's children, building the
        // shader source string.
        var theSource = "";
        var currentChild = shaderScript.firstChild;

        while (currentChild) {
            if (currentChild.nodeType == 3) {
                theSource += currentChild.textContent;
            }

            currentChild = currentChild.nextSibling;
        }

        // Now figure out what type of shader script we have,
        // based on its MIME type.

        var shader;

        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;  // Unknown shader type
        }

        // Send the source to the shader object
        gl.shaderSource(shader, theSource);

        // Compile the shader program
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
    }

    function initTextures(images) {
        for (var imageName in images) {
            if (!images.hasOwnProperty(imageName)) {
                continue;
            }

            var texture = gl.createTexture();
            texture.image = images[imageName];

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[imageName]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);

            textures[imageName] = texture;
        }

        return textures;
    }

    function mvTranslate(v) {
        mat4.translate(mvMatrix, mvMatrix, v);
    }

    var mvMatrixInverseTranspose = mat4.create();

    function setMatrixUniforms() {
        gl.uniformMatrix4fv(shaderProgram.mvUniform, false, mvMatrix);

        mat4.invert(mvMatrixInverseTranspose, mvMatrix);
        mat4.transpose(mvMatrixInverseTranspose, mvMatrixInverseTranspose);

        gl.uniformMatrix4fv(shaderProgram.nUniform, false, mvMatrixInverseTranspose);
    }


    var literallyIsPiDivide180 = Math.PI / 180.0;

    function mvRotate(degrees, axis) {
        mat4.rotate(mvMatrix, mvMatrix, degrees * literallyIsPiDivide180, axis);
    }

    var mvMatrixStack = [];

    function mvScope(fn) {
        mvMatrixStack.push(mat4.clone(mvMatrix));
        fn();
        mvMatrix = mvMatrixStack.pop();
    }

    function setBlending(val) {
        blending = val;

        if (blending) {
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        else {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
        }
    }

    function start() {
        canvas = document.getElementById("glcanvas");

        initWebGL(canvas);
        gl.clearColor(0.509, 0.792, 0.98, 1.0);
        gl.clearDepth(1.0);


        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);


        initShaders();

        function resize(event) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, window.innerWidth, window.innerHeight);
            updatePerspectiveMatrix();
        }

        // Update canvas size whenever window is resized
        window.addEventListener("resize", resize, false);
        resize();

        setBlending(false);

        reset();
    }

    function reset() {
        entities.length = 0;
        cameraAngle = [35, 45, 0];
        cameraPosition = [0.0, -2, -50.0];
        focus = { position: [0, 0, 0] };
    }

    function zoom(by) {
        cameraPosition[2] = Math.max(-100, Math.min(cameraPosition[2] + by, -10));
    }

    function addEntity(entity) {
        entities.push(entity);
    }

    function addEntities(newEntities) {
        _.pushAll(entities, newEntities);
    }

    function setFocus(newFocus) {
        focus = newFocus;
    }

    function getCanvas() {
        return canvas;
    }

    return {
        start: start,
        draw: draw,
        initTextures: initTextures,
        getCameraAngle: getCameraAngle,
        zoom: zoom,
        getViewMatrix: loadCameraMatrix,
        addEntity: addEntity,
        addEntities: addEntities,
        setFocus: setFocus,
        getCanvas: getCanvas,
        reset: reset,
        setBlending: setBlending
    }
};