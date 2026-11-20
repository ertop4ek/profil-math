import type {Metadata} from 'next';
import './globals.css';
import './website.css';
import {Application} from './Application';
export const metadata:Metadata={title:{default:'Профиль — практика математики',template:'%s · Профиль'},description:'Задачи, уроки, подсказки, избранное и сохранение прогресса по профильной математике.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body><Application/>{children}</body></html>}
