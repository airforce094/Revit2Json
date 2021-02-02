attribute highp vec3 aVertex;
uniform mat3 uMvpMatrix;
uniform mat4 uPMatrix;


attribute highp vec2 aTexCoord;
varying vec2 vTexCoord;


attribute highp float aId;
uniform bool uColorCoding;
uniform float uSelection;
varying vec4 vIdColor;


vec4 getIdColor(float id){
	float B = floor(id / (256.0*256.0));
	float G = floor((id - B * 256.0*256.0) / 256.0);
	float R = mod(id, 256.0);
	return vec4(R / 255.0, G / 255.0, B / 255.0, 1.0);
}

void main(void) {

	vec4 point = vec4(uMvpMatrix * aVertex, 1.0);
	gl_Position = uPMatrix * point;

	vTexCoord = aTexCoord;

    // -> fshader
	if (uColorCoding)
	{
		vIdColor = getIdColor(aId);
		return;
	}
	
	bool isSelected = abs(uSelection - aId) < 0.1;
	if (isSelected){
		vIdColor = vec4(-1.0, -1.0, -1.0, -1.0);
	}
	else{
		vIdColor = vec4(1.0, 1.0, 1.0, 1.0);
	}
}