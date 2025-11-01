window.addEventListener("load", () => {
    initFluid()
});
const initFluid = () => {
    const canvas = document.getElementById("fluid");
    resizeCanvas();
    let config = {
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1440,
        CAPTURE_RESOLUTION: 512,
        DENSITY_DISSIPATION: 5,
        VELOCITY_DISSIPATION: 3.5,
        PRESSURE: .1,
        PRESSURE_ITERATIONS: 20,
        CURL: 1.5,
        SPLAT_RADIUS: .1,
        SPLAT_FORCE: 2e3,
        SHADING: !0,
        COLOR_UPDATE_SPEED: 10,
        PAUSED: !1,
        BACK_COLOR: {
            r: 0,
            g: 0,
            b: 0
        },
        TRANSPARENT: !0
    };
    function pointerPrototype() {
        this.id = -1,
        this.texcoordX = 0,
        this.texcoordY = 0,
        this.prevTexcoordX = 0,
        this.prevTexcoordY = 0,
        this.deltaX = 0,
        this.deltaY = 0,
        this.down = !1,
        this.moved = !1,
        this.color = [30, 0, 300]
    }
    let pointers = [];
    pointers.push(new pointerPrototype);
    const {gl, ext} = getWebGLContext(canvas);
    ext.supportLinearFiltering || (config.DYE_RESOLUTION = 512, config.SHADING = !1);
    function getWebGLContext(canvas2) {
        const params = {
            alpha: !0,
            depth: !1,
            stencil: !1,
            antialias: !1,
            preserveDrawingBuffer: !1
        };
        let gl2 = canvas2.getContext("webgl2", params);
        const isWebGL2 = !!gl2;
        isWebGL2 || (gl2 = canvas2.getContext("webgl", params) || canvas2.getContext("experimental-webgl", params));
        let halfFloat,
            supportLinearFiltering;
        isWebGL2 ? (gl2.getExtension("EXT_color_buffer_float"), supportLinearFiltering = gl2.getExtension("OES_texture_float_linear")) : (halfFloat = gl2.getExtension("OES_texture_half_float"), supportLinearFiltering = gl2.getExtension("OES_texture_half_float_linear")),
        gl2.clearColor(0, 0, 0, 1);
        const halfFloatTexType = isWebGL2 ? gl2.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
        let formatRGBA,
            formatRG,
            formatR;
        return isWebGL2 ? (formatRGBA = getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, halfFloatTexType), formatRG = getSupportedFormat(gl2, gl2.RG16F, gl2.RG, halfFloatTexType), formatR = getSupportedFormat(gl2, gl2.R16F, gl2.RED, halfFloatTexType)) : (formatRGBA = getSupportedFormat(gl2, gl2.RGBA, gl2.RGBA, halfFloatTexType), formatRG = getSupportedFormat(gl2, gl2.RGBA, gl2.RGBA, halfFloatTexType), formatR = getSupportedFormat(gl2, gl2.RGBA, gl2.RGBA, halfFloatTexType)), {
            gl: gl2,
            ext: {
                formatRGBA,
                formatRG,
                formatR,
                halfFloatTexType,
                supportLinearFiltering
            }
        }
    }
    function getSupportedFormat(gl2, internalFormat, format, type) {
        if (!supportRenderTextureFormat(gl2, internalFormat, format, type))
            switch (internalFormat) {
            case gl2.R16F:
                return getSupportedFormat(gl2, gl2.RG16F, gl2.RG, type);
            case gl2.RG16F:
                return getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, type);
            default:
                return null
            }
        return {
            internalFormat,
            format
        }
    }
    function supportRenderTextureFormat(gl2, internalFormat, format, type) {
        let texture = gl2.createTexture();
        gl2.bindTexture(gl2.TEXTURE_2D, texture),
        gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MIN_FILTER, gl2.NEAREST),
        gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_MAG_FILTER, gl2.NEAREST),
        gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_S, gl2.CLAMP_TO_EDGE),
        gl2.texParameteri(gl2.TEXTURE_2D, gl2.TEXTURE_WRAP_T, gl2.CLAMP_TO_EDGE),
        gl2.texImage2D(gl2.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
        let fbo = gl2.createFramebuffer();
        return gl2.bindFramebuffer(gl2.FRAMEBUFFER, fbo), gl2.framebufferTexture2D(gl2.FRAMEBUFFER, gl2.COLOR_ATTACHMENT0, gl2.TEXTURE_2D, texture, 0), gl2.checkFramebufferStatus(gl2.FRAMEBUFFER) == gl2.FRAMEBUFFER_COMPLETE
    }
    class Material {
        constructor(vertexShader, fragmentShaderSource)
        {
            this.vertexShader = vertexShader,
            this.fragmentShaderSource = fragmentShaderSource,
            this.programs = [],
            this.activeProgram = null,
            this.uniforms = []
        }
        setKeywords(keywords)
        {
            let hash = 0;
            for (let i = 0; i < keywords.length; i++)
                hash += hashCode(keywords[i]);
            let program = this.programs[hash];
            if (program == null) {
                let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
                program = createProgram(this.vertexShader, fragmentShader),
                this.programs[hash] = program
            }
            program != this.activeProgram && (this.uniforms = getUniforms(program), this.activeProgram = program)
        }
        bind()
        {
            gl.useProgram(this.activeProgram)
        }
    }
    class Program {
        constructor(vertexShader, fragmentShader)
        {
            this.uniforms = {},
            this.program = createProgram(vertexShader, fragmentShader),
            this.uniforms = getUniforms(this.program)
        }
        bind()
        {
            gl.useProgram(this.program)
        }
    }
    function createProgram(vertexShader, fragmentShader) {
        let program = gl.createProgram();
        return gl.attachShader(program, vertexShader), gl.attachShader(program, fragmentShader), gl.linkProgram(program), gl.getProgramParameter(program, gl.LINK_STATUS) || console.trace(gl.getProgramInfoLog(program)), program
    }
    function getUniforms(program) {
        let uniforms = [],
            uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniformName = gl.getActiveUniform(program, i).name;
            uniforms[uniformName] = gl.getUniformLocation(program, uniformName)
        }
        return uniforms
    }
    function compileShader(type, source, keywords) {
        source = addKeywords(source, keywords);
        const shader = gl.createShader(type);
        return gl.shaderSource(shader, source), gl.compileShader(shader), gl.getShaderParameter(shader, gl.COMPILE_STATUS) || console.trace(gl.getShaderInfoLog(shader)), shader
    }
    function addKeywords(source, keywords) {
        if (keywords == null)
            return source;
        let keywordsString = "";
        return keywords.forEach(keyword => {
            keywordsString += "#define " + keyword + `
`
        }), keywordsString + source
    }
    const baseVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`),
        blurVertexShader = compileShader(gl.VERTEX_SHADER, `
    precision highp float;

    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform vec2 texelSize;

    void main () {
        vUv = aPosition * 0.5 + 0.5;
        float offset = 1.33333333;
        vL = vUv - texelSize * offset;
        vR = vUv + texelSize * offset;
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }
`
),
        blurShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    uniform sampler2D uTexture;

    void main () {
        vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
        sum += texture2D(uTexture, vL) * 0.35294117;
        sum += texture2D(uTexture, vR) * 0.35294117;
        gl_FragColor = sum;
    }
`),
        copyShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;

    void main () {
        gl_FragColor = texture2D(uTexture, vUv);
    }
`),
        clearShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;

    void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
    }
`),
    colorShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;

    uniform vec4 color;

    void main () {
        gl_FragColor = color;
    }
`),
    displayShaderSource = `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uTexture;
    uniform sampler2D uDithering;
    uniform vec2 ditherScale;
    uniform vec2 texelSize;

    vec3 linearToGamma (vec3 color) {
        color = max(color, vec3(0));
        return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
    }

    void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
        vec3 lc = texture2D(uTexture, vL).rgb;
        vec3 rc = texture2D(uTexture, vR).rgb;
        vec3 tc = texture2D(uTexture, vT).rgb;
        vec3 bc = texture2D(uTexture, vB).rgb;

        float dx = length(rc) - length(lc);
        float dy = length(tc) - length(bc);

        vec3 n = normalize(vec3(dx, dy, length(texelSize)));
        vec3 l = vec3(0.0, 0.0, 1.0);

        float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
        c *= diffuse;
    #endif

        float a = max(c.r, max(c.g, c.b)) * 0.6;
        gl_FragColor = vec4(c, a);
    }
`,
        splatShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;

    void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
    }
`),
        advectionShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2 texelSize;
    uniform vec2 dyeTexelSize;
    uniform float dt;
    uniform float dissipation;

    vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
        vec2 st = uv / tsize - 0.5;

        vec2 iuv = floor(st);
        vec2 fuv = fract(st);

        vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
        vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
        vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
        vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

        return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
    }

    void main () {
    #ifdef MANUAL_FILTERING
        vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
        vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        vec4 result = texture2D(uSource, coord);
    #endif
        float decay = 1.0 + dissipation * dt;
        gl_FragColor = result / decay;
    }`, 
    ext.supportLinearFiltering ? null : ["MANUAL_FILTERING"]),
        divergenceShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;

        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }

        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
    }
`),
        curlShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
    }
`),
        vorticityShader = compileShader(gl.FRAGMENT_SHADER, `
    precision highp float;
    precision highp sampler2D;

    varying vec2 vUv;
    varying vec2 vL;
    varying vec2 vR;
    varying vec2 vT;
    varying vec2 vB;
    uniform sampler2D uVelocity;
    uniform sampler2D uCurl;
    uniform float curl;
    uniform float dt;

    void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity += force * dt;
        velocity = min(max(velocity, -1000.0), 1000.0);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`),
        pressureShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
    }
`),
        gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER, `
    precision mediump float;
    precision mediump sampler2D;

    varying highp vec2 vUv;
    varying highp vec2 vL;
    varying highp vec2 vR;
    varying highp vec2 vT;
    varying highp vec2 vB;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;

    void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
    }
`),
        blit = (gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()), gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW), gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()), gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW), gl.vertexAttribPointer(0, 2, gl.FLOAT, !1, 0, 0), gl.enableVertexAttribArray(0), (target, clear=!1) => {
            target == null ? (gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight), gl.bindFramebuffer(gl.FRAMEBUFFER, null)) : (gl.viewport(0, 0, target.width, target.height), gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)),
            clear && (gl.clearColor(0, 0, 0, 1), gl.clear(gl.COLOR_BUFFER_BIT)),
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0)
        });
    function CHECK_FRAMEBUFFER_STATUS() {
        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        status != gl.FRAMEBUFFER_COMPLETE && console.trace("Framebuffer error: " + status)
    }
    let dye,
        velocity,
        divergence,
        curl,
        pressure,
        ditheringTexture = createTextureAsync("../app/themes/flipp/dist/images/LDR_LLL1_0.png");
    const blurProgram = new Program(blurVertexShader, blurShader),
        copyProgram = new Program(baseVertexShader, copyShader),
        clearProgram = new Program(baseVertexShader, clearShader),
        colorProgram = new Program(baseVertexShader, colorShader),
        splatProgram = new Program(baseVertexShader, splatShader),
        advectionProgram = new Program(baseVertexShader, advectionShader),
        divergenceProgram = new Program(baseVertexShader, divergenceShader),
        curlProgram = new Program(baseVertexShader, curlShader),
        vorticityProgram = new Program(baseVertexShader, vorticityShader),
        pressureProgram = new Program(baseVertexShader, pressureShader),
        gradienSubtractProgram = new Program(baseVertexShader, gradientSubtractShader),
        displayMaterial = new Material(baseVertexShader, displayShaderSource);
    function initFramebuffers() {
        let simRes = getResolution(config.SIM_RESOLUTION),
            dyeRes = getResolution(config.DYE_RESOLUTION);
        const texType = ext.halfFloatTexType,
            rgba = ext.formatRGBA,
            rg = ext.formatRG,
            r = ext.formatR,
            filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;
        gl.disable(gl.BLEND),
        dye == null ? dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering) : dye = resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering),
        velocity == null ? velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering) : velocity = resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering),
        divergence = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST),
        curl = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST),
        pressure = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST)
    }
    function createFBO(w, h, internalFormat, format, type, param) {
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE),
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
        let fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo),
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0),
        gl.viewport(0, 0, w, h),
        gl.clear(gl.COLOR_BUFFER_BIT);
        let texelSizeX = 1 / w,
            texelSizeY = 1 / h;
        return {
            texture,
            fbo,
            width: w,
            height: h,
            texelSizeX,
            texelSizeY,
            attach(id) {
                return gl.activeTexture(gl.TEXTURE0 + id), gl.bindTexture(gl.TEXTURE_2D, texture), id
            }
        }
    }
    function createDoubleFBO(w, h, internalFormat, format, type, param) {
        let fbo1 = createFBO(w, h, internalFormat, format, type, param),
            fbo2 = createFBO(w, h, internalFormat, format, type, param);
        return {
            width: w,
            height: h,
            texelSizeX: fbo1.texelSizeX,
            texelSizeY: fbo1.texelSizeY,
            get read() {
                return fbo1
            },
            set read(value) {
                fbo1 = value
            },
            get write() {
                return fbo2
            },
            set write(value) {
                fbo2 = value
            },
            swap() {
                let temp = fbo1;
                fbo1 = fbo2,
                fbo2 = temp
            }
        }
    }
    function resizeFBO(target, w, h, internalFormat, format, type, param) {
        let newFBO = createFBO(w, h, internalFormat, format, type, param);
        return copyProgram.bind(), gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0)), blit(newFBO), newFBO
    }
    function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
        return target.width == w && target.height == h || (target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param), target.write = createFBO(w, h, internalFormat, format, type, param), target.width = w, target.height = h, target.texelSizeX = 1 / w, target.texelSizeY = 1 / h), target
    }
    function createTextureAsync(url) {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT),
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));
        let obj = {
                texture,
                width: 1,
                height: 1,
                attach(id) {
                    return gl.activeTexture(gl.TEXTURE0 + id), gl.bindTexture(gl.TEXTURE_2D, texture), id
                }
            },
            image = new Image;
        return image.onload = () => {
            obj.width = image.width,
            obj.height = image.height,
            gl.bindTexture(gl.TEXTURE_2D, texture),
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image)
        }, image.src = url, obj
    }
    function updateKeywords() {
        let displayKeywords = [];
        config.SHADING && displayKeywords.push("SHADING"),
        displayMaterial.setKeywords(displayKeywords)
    }
    updateKeywords(),
    initFramebuffers();
    let lastUpdateTime = Date.now(),
        colorUpdateTimer = 0;
    function update() {
        const dt = calcDeltaTime();
        resizeCanvas() && initFramebuffers(),
        updateColors(dt),
        applyInputs(),
        step(dt),
        render(null),
        requestAnimationFrame(update)
    }
    function calcDeltaTime() {
        let now = Date.now(),
            dt = (now - lastUpdateTime) / 1e3;
        return dt = Math.min(dt, .016666), lastUpdateTime = now, dt
    }
    function resizeCanvas() {
        let width = scaleByPixelRatio(canvas.clientWidth),
            height = scaleByPixelRatio(canvas.clientHeight);
        return canvas.width != width || canvas.height != height ? (canvas.width = width, canvas.height = height, !0) : !1
    }
    function updateColors(dt) {
        colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED,
        colorUpdateTimer >= 1 && (colorUpdateTimer = wrap(colorUpdateTimer, 0, 1), pointers.forEach(p => {
            p.color = generateColor()
        }))
    }
    function applyInputs() {
        pointers.forEach(p => {
            p.moved && (p.moved = !1, splatPointer(p))
        })
    }
    function step(dt) {
        gl.disable(gl.BLEND),
        curlProgram.bind(),
        gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY),
        gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0)),
        blit(curl),
        vorticityProgram.bind(),
        gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY),
        gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0)),
        gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1)),
        gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL),
        gl.uniform1f(vorticityProgram.uniforms.dt, dt),
        blit(velocity.write),
        velocity.swap(),
        divergenceProgram.bind(),
        gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY),
        gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0)),
        blit(divergence),
        clearProgram.bind(),
        gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0)),
        gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE),
        blit(pressure.write),
        pressure.swap(),
        pressureProgram.bind(),
        gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY),
        gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++)
            gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1)),
            blit(pressure.write),
            pressure.swap();
        gradienSubtractProgram.bind(),
        gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY),
        gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0)),
        gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1)),
        blit(velocity.write),
        velocity.swap(),
        advectionProgram.bind(),
        gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY),
        ext.supportLinearFiltering || gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
        let velocityId = velocity.read.attach(0);
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId),
        gl.uniform1i(advectionProgram.uniforms.uSource, velocityId),
        gl.uniform1f(advectionProgram.uniforms.dt, dt),
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION),
        blit(velocity.write),
        velocity.swap(),
        ext.supportLinearFiltering || gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY),
        gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0)),
        gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1)),
        gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION),
        blit(dye.write),
        dye.swap()
    }
    function render(target) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA),
        gl.enable(gl.BLEND),
        drawDisplay(target)
    }
    function drawDisplay(target) {
        let width = target == null ? gl.drawingBufferWidth : target.width,
            height = target == null ? gl.drawingBufferHeight : target.height;
        displayMaterial.bind(),
        config.SHADING && gl.uniform2f(displayMaterial.uniforms.texelSize, 1 / width, 1 / height),
        gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0)),
        blit(target)
    }
    function splatPointer(pointer) {
        let dx = pointer.deltaX * config.SPLAT_FORCE,
            dy = pointer.deltaY * config.SPLAT_FORCE;
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color)
    }
    function clickSplat(pointer) {
        const color = generateColor();
        color.r *= 6,
        color.g *= 6,
        color.b *= 6;
        let dx = 10 * (Math.random() - .5),
            dy = 30 * (Math.random() - .5);
        splat(pointer.texcoordX, pointer.texcoordY, dx, dy, color)
    }
    function splat(x, y, dx, dy, color) {
        splatProgram.bind(),
        gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0)),
        gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height),
        gl.uniform2f(splatProgram.uniforms.point, x, y),
        gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0),
        gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100)),
        blit(velocity.write),
        velocity.swap(),
        gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0)),
        gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b),
        blit(dye.write),
        dye.swap()
    }
    function correctRadius(radius) {
        let aspectRatio = canvas.width / canvas.height;
        return aspectRatio > 1 && (radius *= aspectRatio), radius
    }
    window.addEventListener("mousedown", e => {
        let pointer = pointers[0],
            posX = scaleByPixelRatio(e.clientX),
            posY = scaleByPixelRatio(e.clientY);
        updatePointerDownData(pointer, -1, posX, posY),
        clickSplat(pointer)
    }),
    document.body.addEventListener("mousemove", e => {
        let pointer = pointers[0],
            posX = scaleByPixelRatio(e.clientX),
            posY = scaleByPixelRatio(e.clientY),
            color = generateColor();
        update(),
        updatePointerMoveData(pointer, posX, posY, color)
    }, {
        once: !0
    }),
    window.addEventListener("mousemove", e => {
        let pointer = pointers[0],
            posX = scaleByPixelRatio(e.clientX),
            posY = scaleByPixelRatio(e.clientY),
            color = pointer.color;
        updatePointerMoveData(pointer, posX, posY, color)
    }),
    document.body.addEventListener("touchstart", e => {
        const touches = e.targetTouches;
        let touch = touches[0],
            pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            let posX = scaleByPixelRatio(touches[i].clientX),
                posY = scaleByPixelRatio(touches[i].clientY);
            update(),
            updatePointerDownData(pointer, touches[i].identifier, posX, posY)
        }
    }, {
        once: !0
    }),
    window.addEventListener("touchstart", e => {
        const touches = e.targetTouches;
        let pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            let posX = scaleByPixelRatio(touches[i].clientX),
                posY = scaleByPixelRatio(touches[i].clientY);
            updatePointerDownData(pointer, touches[i].identifier, posX, posY)
        }
    }),
    window.addEventListener("touchmove", e => {
        const touches = e.targetTouches;
        let pointer = pointers[0];
        for (let i = 0; i < touches.length; i++) {
            let posX = scaleByPixelRatio(touches[i].clientX),
                posY = scaleByPixelRatio(touches[i].clientY);
            updatePointerMoveData(pointer, posX, posY, pointer.color)
        }
    }, !1),
    window.addEventListener("touchend", e => {
        const touches = e.changedTouches;
        let pointer = pointers[0];
        for (let i = 0; i < touches.length; i++)
            updatePointerUpData(pointer)
    });
    function updatePointerDownData(pointer, id, posX, posY) {
        pointer.id = id,
        pointer.down = !0,
        pointer.moved = !1,
        pointer.texcoordX = posX / canvas.width,
        pointer.texcoordY = 1 - posY / canvas.height,
        pointer.prevTexcoordX = pointer.texcoordX,
        pointer.prevTexcoordY = pointer.texcoordY,
        pointer.deltaX = 0,
        pointer.deltaY = 0,
        pointer.color = generateColor()
    }
    function updatePointerMoveData(pointer, posX, posY, color) {
        pointer.prevTexcoordX = pointer.texcoordX,
        pointer.prevTexcoordY = pointer.texcoordY,
        pointer.texcoordX = posX / canvas.width,
        pointer.texcoordY = 1 - posY / canvas.height,
        pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX),
        pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY),
        pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0,
        pointer.color = color
    }
    function updatePointerUpData(pointer) {
        pointer.down = !1
    }
    function correctDeltaX(delta) {
        let aspectRatio = canvas.width / canvas.height;
        return aspectRatio < 1 && (delta *= aspectRatio), delta
    }
    function correctDeltaY(delta) {
        let aspectRatio = canvas.width / canvas.height;
        return aspectRatio > 1 && (delta /= aspectRatio), delta
    }
    // function generateColor() {
        
    //     let c = HSVtoRGB(Math.random(), 1, 1);
    //     return c.r *= .08, c.g *= .08, c.b *= .08, c
    // }
    function generateColor() {
        const colors = [
            {r: 1.0, g: 0.996, b: 0.992},    // #fffefd (cream white)
            {r: 0.235, g: 0.243, b: 0.549},  // #3c3e8c (deep blue)
            {r: 1.0, g: 0.541, b: 0.361}     // #ff8a5c (coral orange)
        ];
        
        // Pick a random color from your palette
        let color = colors[Math.floor(Math.random() * colors.length)];
        
        // Apply intensity multiplier
        return {
            r: color.r * 0.08,
            g: color.g * 0.08,
            b: color.b * 0.08
        };
    }
    function HSVtoRGB(h, s, v) {
        let r, g, b, i, f, p, q, t;
        switch (i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), i % 6) {
        case 0:
            r = v,
            g = t,
            b = p;
            break;
        case 1:
            r = q,
            g = v,
            b = p;
            break;
        case 2:
            r = p,
            g = v,
            b = t;
            break;
        case 3:
            r = p,
            g = q,
            b = v;
            break;
        case 4:
            r = t,
            g = p,
            b = v;
            break;
        case 5:
            r = v,
            g = p,
            b = q;
            break
        }
        return {
            r,
            g,
            b
        }
    }
    function wrap(value, min, max) {
        let range = max - min;
        return range == 0 ? min : (value - min) % range + min
    }
    function getResolution(resolution) {
        let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
        aspectRatio < 1 && (aspectRatio = 1 / aspectRatio);
        let min = Math.round(resolution),
            max = Math.round(resolution * aspectRatio);
        return gl.drawingBufferWidth > gl.drawingBufferHeight ? {
            width: max,
            height: min
        } : {
            width: min,
            height: max
        }
    }
    function scaleByPixelRatio(input) {
        let pixelRatio = window.devicePixelRatio || 1;
        return Math.floor(input * pixelRatio)
    }
    function hashCode(s) {
        if (s.length == 0)
            return 0;
        let hash = 0;
        for (let i = 0; i < s.length; i++)
            hash = (hash << 5) - hash + s.charCodeAt(i),
            hash |= 0;
        return hash
    }
};