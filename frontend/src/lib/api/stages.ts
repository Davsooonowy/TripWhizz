import { BaseApiClient } from '@/lib/api/base.ts';
import { API_URL } from '@/lib/config.ts';

const STAGE_API_URL = `${API_URL}/trips/stage`;

export interface StageElement {
  id?: number;
  name: string;
  description?: string;
  url?: string;
  image?: string;
  stage: number;
}

export class StagesApiClient extends BaseApiClient {
  async getStageElements(stageId: number) {
    const response = await fetch(`${STAGE_API_URL}/${stageId}/elements/`, {
      ...this._requestConfiguration(true),
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async addStageElement(stageElement: StageElement) {
    const response = await fetch(`${STAGE_API_URL}/element/`, {
      ...this._requestConfiguration(true),
      method: 'POST',
      body: JSON.stringify(stageElement),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async updateStageElement(
    elementId: number,
    updatedElement: Partial<StageElement>,
  ) {
    const response = await fetch(`${STAGE_API_URL}/element/${elementId}/`, {
      ...this._requestConfiguration(true),
      method: 'PUT',
      body: JSON.stringify(updatedElement),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }

  async reactToStageElement(elementId: number, reaction: 'like' | 'dislike') {
    const response = await fetch(
      `${STAGE_API_URL}/element/${elementId}/react/`,
      {
        ...this._requestConfiguration(true),
        method: 'PUT',
        body: JSON.stringify({ reaction }),
      },
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  }
}
