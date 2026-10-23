import {test,expect} from 'bun:test';
import {storyReducer,initialStory,storyStepCount,storySceneCount} from '../src/story-player';
import {storyCopy} from '../src/story-copy';

test('scene navigation crosses lessons and stays bounded',()=>{
 let state=initialStory;
 for(let i=0;i<storySceneCount+10;i++)state=storyReducer(state,{type:'next'});
 expect([state.step,state.scene]).toEqual([storyStepCount-1,3]);
 state=storyReducer(state,{type:'previous'});
 expect([state.step,state.scene]).toEqual([storyStepCount-1,2]);
 for(let i=0;i<storySceneCount+10;i++)state=storyReducer(state,{type:'previous'});
 expect([state.step,state.scene]).toEqual([0,0]);
});
test('focus playback finishes without advancing the reading scene',()=>{
 let state=storyReducer(initialStory,{type:'select',step:2,scene:1});
 state=storyReducer(state,{type:'play'});
 expect(state.beat).toBe(0);
 for(let i=0;i<3;i++)state=storyReducer(state,{type:'beat'});
 expect(state).toMatchObject({step:2,scene:1,beat:2,playing:false});
});
test('interruption and resume preserve the current scene',()=>{
 let state=storyReducer(initialStory,{type:'select',step:1,scene:2});
 state=storyReducer(state,{type:'play'});
 state=storyReducer(state,{type:'pause'});
 state=storyReducer(state,{type:'select',step:state.step,scene:state.scene});
 expect(state).toMatchObject({step:1,scene:2,playing:false});
 expect(storyReducer(state,{type:'select',step:1,scene:'invalid'}).scene).toBe(0);
});
test('each chapter has four explicit colored story segments',()=>{
 expect(Object.keys(storyCopy)).toHaveLength(storyStepCount);
 for(const scenes of Object.values(storyCopy)){
  expect(scenes).toHaveLength(4);
  for(const text of scenes){expect(text.length).toBeGreaterThan(80);expect(text).toMatch(/\{\{(added|removed|modified|context)\|[^}]+\}\}/);}
 }
});
