#include <common>

varying vec2 vUv;
const float num_steps = 4.0;
const float num_directions = 4.0;
uniform float near;
uniform float far;
uniform vec4 proj_info;
uniform bool is_ortho;
uniform vec2 resolution;
uniform float radius_of_influence;
uniform float radius_in_screen_space;
uniform float exponent;
uniform vec3 ao_color;
uniform float bias;
uniform sampler2D texture_depth;
// uniform sampler2D texture_normals;
uniform sampler2D texture_blue_noise;
uniform sampler2D texture_blue_noise_in_disk;
uniform sampler2D texture_color_pass;
uniform float frame_index;
uniform bool fog_enabled;
uniform float fog_near;
uniform float fog_far;
// uniform mat4 projectionMatrixInverse;
// uniform mat4 cameraMatrixWorld;
vec3 uv_to_view_space(vec2 uv, float eye_z) {
    return vec3((uv*proj_info.xy+proj_info.zw)*(is_ortho ? 1.0 : eye_z), eye_z);
}
float linearize_depth(float depth_sampled) {
    float z = is_ortho ? depth_sampled : depth_sampled*2.0-1.0;
    return mix((2.0*near*far)/(far+near-z*(far-near)), near+z*(far-near), float(is_ortho));
}
vec3 get_view_position(vec2 uv_coords) {
    float linear_depth = linearize_depth(texture2D(texture_depth, uv_coords).x);
    return uv_to_view_space(uv_coords, linear_depth);
}
vec3 min_difference(vec3 p, vec3 right, vec3 left) {
    vec3 v1 = right-p;
    vec3 v2 = p-left;
    return(dot(v1, v1)<dot(v2, v2))? v1 : v2;
}
// vec3 rebuild_normal(in vec2 uv, in vec3 p) {
//     vec2 one_over_resolution = 1.0/resolution;
//     vec3 r = get_view_position(uv+vec2(one_over_resolution.x, 0));
//     vec3 l = get_view_position(uv+vec2(-one_over_resolution.x, 0));
//     vec3 t = get_view_position(uv+vec2(0, one_over_resolution.y));
//     vec3 b = get_view_position(uv+vec2(0, -one_over_resolution.y));
//     return normalize(cross(min_difference(p, r, l), min_difference(p, t, b)));
// }

// vec3 getWorldPos(const float depth, const vec2 coord) {
//     float z = depth * 2.0 - 1.0;
//     vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
//     vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;

//     // Perspective division
//     vec4 worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
//     worldSpacePosition.xyz /= worldSpacePosition.w;

//     return worldSpacePosition.xyz;
// }

vec3 getWorldPos(const float depth, const vec2 coord) {
    // float z = depth * 2.0 - 1.0;
    // vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
    // vec4 viewSpacePosition = projectionMatrixInverse * clipSpacePosition;

    // // Perspective division
    // vec4 worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
    // worldSpacePosition.xyz /= worldSpacePosition.w;

    return uv_to_view_space( coord, linearize_depth(depth) );
}

vec3 rebuild_normal(vec3 worldPos, vec2 vUv) {
    vec2 size = vec2(textureSize(texture_depth, 0));
       ivec2 p = ivec2(vUv * size);
       float c0 = texelFetch(texture_depth, p, 0).x;
       float l2 = texelFetch(texture_depth, p - ivec2(2, 0), 0).x;
       float l1 = texelFetch(texture_depth, p - ivec2(1, 0), 0).x;
       float r1 = texelFetch(texture_depth, p + ivec2(1, 0), 0).x;
       float r2 = texelFetch(texture_depth, p + ivec2(2, 0), 0).x;
       float b2 = texelFetch(texture_depth, p - ivec2(0, 2), 0).x;
       float b1 = texelFetch(texture_depth, p - ivec2(0, 1), 0).x;
       float t1 = texelFetch(texture_depth, p + ivec2(0, 1), 0).x;
       float t2 = texelFetch(texture_depth, p + ivec2(0, 2), 0).x;
       float dl = abs((2.0 * l1 - l2) - c0);
       float dr = abs((2.0 * r1 - r2) - c0);
       float db = abs((2.0 * b1 - b2) - c0);
       float dt = abs((2.0 * t1 - t2) - c0);
       vec3 ce = getWorldPos(c0, vUv).xyz;
       vec3 dpdx = (dl < dr) ? ce - getWorldPos(l1, (vUv - vec2(1.0 / size.x, 0.0))).xyz
                             : -ce + getWorldPos(r1, (vUv + vec2(1.0 / size.x, 0.0))).xyz;
       vec3 dpdy = (db < dt) ? ce - getWorldPos(b1, (vUv - vec2(0.0, 1.0 / size.y))).xyz
                             : -ce + getWorldPos(t1, (vUv + vec2(0.0, 1.0 / size.y))).xyz;
       return normalize(cross(dpdx, dpdy));
}

float falloff(float distance_squared) {
    float neg_inv_r2 = -1.0/(radius_of_influence*radius_of_influence);
    return distance_squared*neg_inv_r2+1.0;
}
float ao_contribution(vec3 P, vec3 N, vec3 S) {
    vec3 to_sample = S-P;
    float norm_squared = dot(to_sample, to_sample);
    float norm = sqrt(norm_squared);
    float cos_theta = dot(N, to_sample)/norm;
    return clamp(cos_theta-bias, 0.0, 1.0)*clamp(falloff(norm_squared), 0.0, 1.0);
}
float compute_ambient_occlusion(vec2 uv, float radius_in_screen_space, vec3 pc, vec3 view_space_n) {
    vec2 one_over_resolution = 1.0/resolution;

    // 128 is the texture width
    ivec2 noise_uv = ivec2(int(mod(gl_FragCoord.x, 128.0)), int(mod(gl_FragCoord.y, 128.0)));
    float noise = texelFetch(texture_blue_noise, noise_uv, 0).r;
    noise = fract(noise+0.61803398875*float(frame_index));
    float theta = noise*2.0*PI;
    float ct = cos(theta);
    float st = sin(theta);
    float step_size = radius_in_screen_space/(num_steps+1.0);
    const float angle_step = 2.0*PI/num_directions;
    float contribution = 0.0;
    for(int i = 0;
    i<int(num_directions);++i) {
        float current_pixel = step_size+1.0;
        for(int j = 0;
        j<int(num_steps);++j) {
            int index = i*int(num_steps)+j;
            vec2 blue_noise_sample = texelFetch(texture_blue_noise_in_disk, ivec2(index, 0), 0).rg;
            vec2 disk_point;
            disk_point.x = blue_noise_sample.x*ct-blue_noise_sample.y*st;
            disk_point.y = blue_noise_sample.x*st+blue_noise_sample.y*ct;
            vec2 sample_direction = disk_point;
            vec2 snapped_uv = round(current_pixel*sample_direction)*one_over_resolution+uv;
            vec3 ps = get_view_position(snapped_uv);
            current_pixel += step_size;
            contribution += ao_contribution(pc, view_space_n, ps);
        }

    }
    float mult = 1.0/(1.0-bias);
    contribution *= mult/(num_directions*num_steps);
    return clamp(1.0-contribution*2.0, 0.0, 1.0);
}
// #define USE_GBUFFER_NORMALS
void main() {
    vec3 view_space_p = get_view_position(vUv);
    #ifdef USE_GBUFFER_NORMALS
        // vec3 view_space_n = texture(texture_normals, vUv).rgb;
        // view_space_n.z *= -1.0;
    #else

        // float depth = textureLod(texture_depth, vUv, 0.).x;
        // vec3 worldPos = getWorldPos(depth, vUv);
        vec3 view_space_n = -rebuild_normal(view_space_p, vUv);
        // vec3 view_space_n = -rebuild_normal(vUv, view_space_p);
    #endif
    float radius_ss = radius_in_screen_space/(is_ortho ? 1.0 : view_space_p.z);
    float ao = compute_ambient_occlusion(vUv, radius_ss, view_space_p, view_space_n);
    float final = pow(ao, exponent);
    if(view_space_p.z >= far) {
        final = 1.0;
    } 
    // vec3 color = mix(ao_color, vec3(1.0), final);
    // if(fog_enabled) {
    //     float fog_factor = smoothstep(fog_near, fog_far, view_space_p.z);
    //     color = mix(color, vec3(1.0), fog_factor);
    // }
    gl_FragColor = vec4(ao,ao,ao , 1.0);
    // gl_FragColor = texture2D(texture_blue_noise_in_disk, vUv);

    // gl_FragColor.a = 1.0;
}
