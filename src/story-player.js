export const storyStepCount = 8;
export const storySceneCount = storyStepCount * 4;
export const sceneKeys = ["reason", "look", "explain", "result"];
export const sceneLabels = ["Why this matters", "What changes", "How it works", "Try an example"];
export const initialStory = { step: 0, scene: 0, beat: 2, playing: false };
export function storyReducer(state, action) {
  switch (action.type) {
    case "select":
      return { ...state, step: Math.max(0, Math.min(storyStepCount - 1, action.step)), scene: Number.isInteger(action.scene) ? Math.max(0, Math.min(3, action.scene)) : 0, playing: false, beat: 2 };
    case "next": {
      const index = Math.min(storySceneCount - 1, state.step * 4 + state.scene + 1);
      return { ...state, step: Math.floor(index / 4), scene: index % 4, playing: false, beat: 2 };
    }
    case "previous": {
      const index = Math.max(0, state.step * 4 + state.scene - 1);
      return { ...state, step: Math.floor(index / 4), scene: index % 4, playing: false, beat: 2 };
    }
    case "play":
      return { ...state, playing: true, beat: 0 };
    case "pause":
      return { ...state, playing: false, beat: 2 };
    case "beat":
      return state.playing ? { ...state, beat: Math.min(2, state.beat + 1), playing: state.beat < 2 } : state;
    default:
      return state;
  }
}
