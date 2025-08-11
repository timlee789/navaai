// ComfyUI Workflow Templates
export const WORKFLOW_TEMPLATES = {
  // 기본 이미지 생성 워크플로우
  default: {
    name: 'Default Generation',
    description: 'General purpose image generation',
    workflow: {
      "3": {
        "inputs": {
          "seed": "{{seed}}",
          "steps": 20,
          "cfg": 7.5,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": "{{prompt}}",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "{{negative_prompt}}",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      }
    }
  },

  // 고해상도 워크플로우 (SDXL용)
  highres: {
    name: 'High Resolution',
    description: 'High quality 1024x1024 generation',
    workflow: {
      // SDXL 워크플로우 (flux1-dev-fp8.safetensors 사용)
      "3": {
        "inputs": {
          "seed": "{{seed}}",
          "steps": 25,
          "cfg": 8,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": "flux1-dev-fp8.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": "{{prompt}}",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "{{negative_prompt}}",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "filename_prefix": "ComfyUI_HR",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      }
    }
  },

  // 로고 디자인용 워크플로우
  logo: {
    name: 'Logo Design',
    description: 'Clean logo and brand design',
    workflow: {
      // 로고용 최적화된 워크플로우
      "3": {
        "inputs": {
          "seed": "{{seed}}",
          "steps": 30,
          "cfg": 9,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "4": {
        "inputs": {
          "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "text": "{{prompt}}, clean design, minimalist, professional, vector style, simple",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "7": {
        "inputs": {
          "text": "{{negative_prompt}}, photography, realistic, cluttered, busy, complex background",
          "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "8": {
        "inputs": {
          "samples": ["3", 0],
          "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
      },
      "9": {
        "inputs": {
          "filename_prefix": "ComfyUI_Logo",
          "images": ["8", 0]
        },
        "class_type": "SaveImage"
      }
    }
  }
};

// 워크플로우 자동 선택 로직
export function selectWorkflowByPrompt(prompt, options = {}) {
  const promptLower = prompt.toLowerCase();
  
  // 키워드 기반 워크플로우 선택
  if (promptLower.includes('logo') || promptLower.includes('brand') || promptLower.includes('icon')) {
    return 'logo';
  } else if (options.highRes || promptLower.includes('high quality') || promptLower.includes('detailed')) {
    return 'highres';
  } else {
    return 'default';
  }
}

// 워크플로우 템플릿 변수 치환
export function processWorkflowTemplate(templateName, variables) {
  const template = WORKFLOW_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Workflow template '${templateName}' not found`);
  }

  const workflow = JSON.parse(JSON.stringify(template.workflow));
  
  // 템플릿 변수 치환
  const processNode = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return variables[key] !== undefined ? variables[key] : match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(processNode);
    } else if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = processNode(value);
      }
      return result;
    }
    return obj;
  };

  return processNode(workflow);
}