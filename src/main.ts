import shaderSource from './shader/shader.wgsl?raw';


class Renderer {

  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;
  private positionBuffer!: GPUBuffer;
  private colorsBuffer!: GPUBuffer;

  constructor() {

  }

  public async initialize(): Promise<void> {

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    /**
     * The GPUCanvasContext interface of the WebGPU API provides a drawing 
     * context for a <canvas> element.
     * It is used to draw content onto the canvas.
     */
    this.context = canvas.getContext("webgpu") as GPUCanvasContext;

    if (!this.context) {
      console.error("WebGPU not supported");
      alert("WebGPU not supported");
      return;
    }

    /**
     * The GPUAdapter interface of the WebGPU API provides access to available GPUs on the system.
     * It is the starting point for all WebGPU applications.
     */
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      console.error("No adapter found");
      alert("No adapter found");
      return;
    }

    /**
     * The GPUDevice interface of the WebGPU API represents a connected physical device.
     * It is used to create all other WebGPU objects.
     * It is created from a GPUAdapter.
     * It is the starting point for all WebGPU applications.
     */
    this.device = await adapter.requestDevice();

    /**
     * The GPUDevice.configure method of the WebGPU API configures the device for a given canvas.
     * It is used to set the device's preferred format and size for the canvas.
     * It is called once per canvas.
     * It is called before any other WebGPU methods.
     */
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat() // RGBA8Unorm is the only guaranteed renderable format
    });

    this.prepareModel();

    this.positionBuffer = this.createBuffer(new Float32Array([
      -0.5, -0.5, // x, y
       0.5, -0.5,
      -0.5,  0.5,
      -0.5,  0.5,
       0.5,  0.5,
       0.5, -0.5
    ]));

    this.colorsBuffer = this.createBuffer(new Float32Array([
      1.0, 0.0, 1.0,  // r g b 
      0.0, 1.0, 1.0,
      0.0, 1.0, 1.0,
      1.0, 0.0, 0.0,  // r g b 
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
    ]));
  }

  private createBuffer(data: Float32Array): GPUBuffer {

    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  private prepareModel(): void {

    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    });

    const positionBufferLayout: GPUVertexBufferLayout =
    {
      arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT, // 2 floats * 4 bytes per float
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x2" // 2 floats
        }
      ],
      stepMode: "vertex"
    };

    const colorBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT, // rgb * 4 bytes per float
      attributes: [
        {
          shaderLocation: 1,
          offset: 0,
          format: "float32x3" // 3 floats
        }
      ],
      stepMode: "vertex"
    };

    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: "vertexMain", // name of the entry point function for vertex shader, must be same as in shader
      buffers: [
        positionBufferLayout,
        colorBufferLayout,
      ]
    };

    const fragmentState: GPUFragmentState = {
      module: shaderModule,
      entryPoint: "fragmentMain", // name of the entry point function for fragment/pixel shader, must be same as in shader
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat() 
        }
      ]
    };

    this.pipeline = this.device.createRenderPipeline({
      vertex: vertexState,
      fragment: fragmentState,
      primitive: {
        topology: "triangle-list" // type of primitive to render
      },
      layout: "auto",
    });

  }

  public draw(): void {
    /**
     * The GPUCommandEncoder interface of the WebGPU API is
     * a base interface for all command encoders.
     * It is used to create command buffers.
     */
    const commandEncoder = this.device.createCommandEncoder();

    /**
     * The GPURenderPassDescriptor interface of the WebGPU API 
     * is used to describe a render pass.
     * It is used to create a render pass encoder.
     */
    const renderPassDescriptor: GPURenderPassDescriptor = {
      /**
       * The colorAttachments property of the GPURenderPassDescriptor 
       * interface of the WebGPU API is an array of color attachments.
       * It is used to describe the color attachments of a render pass.
       * It is used to create a render pass encoder.
       */
      colorAttachments: [
        {
          // clearColor is used to describe the color that the 
          // texture will be cleared to.
          clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
          // loadOp is used to describe how the texture will be
          // loaded. In this case, we are clearing the texture.
          loadOp: "clear", 
          // storeOp is used to describe how the texture will be stored.
          // In this case, we are storing the texture.
          storeOp: "store",
          // view is used to describe the texture that will be rendered to.
          view: this.context.getCurrentTexture().createView()
        }
      ]
    };

    // beginRenderPass is used to create a render pass encoder. 
    // It is called once per render pass.
    // passEncoder is used to encode commands for a render pass.
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    // DRAW HERE
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setVertexBuffer(0, this.positionBuffer);
    passEncoder.setVertexBuffer(1, this.colorsBuffer);
    passEncoder.draw(6); // draw 3 vertices

    // endPass is used to end a render pass encoder.
    passEncoder.end();
    
    // submit is used to submit a command buffer to the GPU.
    // commandEncoder.finish() is used to create a command buffer.
    this.device.queue.submit([commandEncoder.finish()]);
  }

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());