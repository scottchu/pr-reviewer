import React from 'react';
import {ChangeCard} from './ChangeCard.tsx';
import {mountPreview} from './preview-runtime.ts';
import './style.css';

mountPreview(onMounted => React.createElement(ChangeCard, {onMounted}), 3);
