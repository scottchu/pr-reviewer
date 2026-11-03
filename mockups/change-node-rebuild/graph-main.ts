import React from 'react';
import {GraphProbe} from './GraphProbe.tsx';
import {mountPreview} from './preview-runtime.ts';
import './style.css';
import './graph.css';

mountPreview(onMounted => React.createElement(GraphProbe, {onMounted}), 4);
