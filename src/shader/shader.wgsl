struct VertexOut {
  @builtin(position) position : vec4f, // The position of the vertex in clip space
  @location(0) color : vec4f
}

// The vertex shader is called for each vertex in the vertex array.
// The vertex index is passed in as a builtin variable.
@vertex
fn vertexMain(
  @location(0) pos: vec2f,  // xy
  @location(1) color: vec3f,  // rgb
) -> VertexOut
{
  var output : VertexOut;

  output.position = vec4f(pos, 0.0, 1.0);
  output.color = vec4f(color, 1.0);

  return output;
}

// The fragment shader is called for each pixel in the triangle.
@fragment
fn fragmentMain(fragData: VertexOut) -> @location(0) vec4f
{
  return fragData.color; // final color of the pixel
}