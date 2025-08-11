// ComfyUI API integration service
import { v4 as uuidv4 } from 'uuid';
import { selectWorkflowByPrompt, processWorkflowTemplate } from './workflow-templates';

const COMFYUI_SERVER = 'http://192.168.1.170:8188';

class ComfyUIService {
  constructor() {
    this.serverUrl = COMFYUI_SERVER;
  }

  // Test ComfyUI server connection
  async testConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/system_stats`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('ComfyUI connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get queue status
  async getQueueStatus() {
    try {
      const response = await fetch(`${this.serverUrl}/queue`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Queue status error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate workflow JSON with dynamic prompt and template selection
  generateWorkflow(prompt, negativePrompt = "low quality, blurry, artifacts", options = {}) {
    const clientId = uuidv4();
    
    // Auto-select workflow template based on prompt
    const templateName = options.template || selectWorkflowByPrompt(prompt, options);
    
    console.log(`Selected workflow template: ${templateName} for prompt: "${prompt.substring(0, 50)}..."`);
    
    // Process workflow template with variables
    const workflow = processWorkflowTemplate(templateName, {
      prompt: prompt,
      negative_prompt: negativePrompt,
      seed: Math.floor(Math.random() * 1000000000),
      width: options.width || 512,
      height: options.height || 512,
      steps: options.steps || 20,
      cfg: options.cfg || 7.5
    });

    return { workflow, clientId, templateName };
  }

  // Submit generation request to ComfyUI
  async generateImage(prompt, negativePrompt, options = {}) {
    try {
      const { workflow, clientId, templateName } = this.generateWorkflow(prompt, negativePrompt, options);

      console.log('Sending request to ComfyUI:', { prompt, options, templateName });

      const response = await fetch(`${this.serverUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: workflow,
          client_id: clientId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('ComfyUI response:', result);

      return {
        success: true,
        promptId: result.prompt_id,
        clientId: clientId,
        workflow: workflow,
        templateName: templateName
      };
    } catch (error) {
      console.error('Image generation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get generation progress/result
  async getGenerationResult(promptId) {
    try {
      const historyResponse = await fetch(`${this.serverUrl}/history/${promptId}`);
      const historyData = await historyResponse.json();

      if (!historyData[promptId]) {
        // Still processing
        return { success: true, status: 'processing', progress: null };
      }

      const history = historyData[promptId];
      
      if (history.status?.completed) {
        // Find generated images
        const outputs = history.outputs;
        const images = [];
        
        for (const nodeId in outputs) {
          if (outputs[nodeId].images) {
            for (const image of outputs[nodeId].images) {
              images.push({
                filename: image.filename,
                subfolder: image.subfolder,
                type: image.type,
                url: `${this.serverUrl}/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`
              });
            }
          }
        }

        return {
          success: true,
          status: 'completed',
          images: images,
          history: history
        };
      } else {
        return { success: true, status: 'processing', progress: history.status };
      }
    } catch (error) {
      console.error('Get result error:', error);
      return { success: false, error: error.message };
    }
  }

  // Download generated image
  async downloadImage(filename, subfolder = '', type = 'output') {
    try {
      const url = `${this.serverUrl}/view?filename=${filename}&subfolder=${subfolder}&type=${type}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        blob: await response.blob(),
        url: url
      };
    } catch (error) {
      console.error('Download image error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ComfyUIService();