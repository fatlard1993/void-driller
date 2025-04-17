import process from 'process';
import { Page } from 'vanilla-bean-components';

import router from './router';

import './socket';

window.process = process;

new Page({ appendTo: document.body, append: router });
