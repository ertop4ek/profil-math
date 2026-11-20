// Direct resource URLs inspected through search on 2026-11-18. We link to the
// authors' pages, never copy their lessons or claim ownership of their videos.
const e=(slug,title,description='Теория и разобранные примеры по теме.')=>({title,description,provider:'ЕГЭ-Студия',format:'Статья с разборами',url:'https://ege-study.ru/'+slug,checked:'2026-11-18'});
const t=(path,title)=>({title,description:'Авторская подборка задач со ссылками на видеоразборы.',provider:'Борис Трушин',format:'Подборка и видео',url:'https://trushinbv.ru/shkolnikam/podgotovka-k-ege/matematika/'+path,checked:'2026-11-18'});
const m='ru/ege/materialy/matematika/';
export const lessonSources={
 plane:e(m+'zadanie-6-profilnogo-ege-po-matematike-planimetriya/','Планиметрия: треугольники, окружности и площади'),
 planeVideo:t('191-zadanie-1','Планиметрия первой части: задачи и видеоразборы'),
 vectors:e(m+'vektory-na-ege-po-matematike-v-zadache-v6-dejstviya-nad-vektorami/','Векторы и действия над векторами'),
 vectorsVideo:t('192-zadanie-2','Векторы: разборы задач Бориса Трушина'),
 solid:e(m+'zadanie-3-profilnogo-ege-po-matematike-stereometriya/','Стереометрия первой части'),
 solidStream:e('stereometriya-v-1-chasti-ege-reshaem-zadanie-3/','Стереометрия: как применять формулы','Страница тематического занятия и дополнительных материалов.'),
 probability:e(m+'teoriya-veroyatnostej-na-ege-po-matematike/','Вероятность: события, формулы и примеры'),
 probabilityVideo:t('24-teoriya-veroyatnostej','Вероятность: задачи со ссылками на видео'),
 equations:e(m+'zadanie-1-prostejshie-uravneniya/','Простейшие уравнения разных типов'),
 equationsVideo:t('195-zadanie-6','Уравнения первой части: разборы'),
 transforms:e(m+'zadanie-9-vychisleniya-i-preobrazovaniya/','Степени, логарифмы и преобразования'),
 derivative:e(m+'zadanie-8-profilnogo-ege-po-matematike-proizvodnaya-povedenie-funkcii-pervoobraznaya/','Производная, касательная и поведение функции'),
 functions:e(m+'funkcii-i-grafiki-proizvodnaya-i-pervoobraznaya/','Функции и графики: повторение основ'),
 elementary:e(m+'elementarnye-funkcii-i-ix-grafiki/','Элементарные функции и их графики'),
 graphShift:e('spravochnik/preobrazovanie-grafikov-funkcij/','Преобразования и сдвиги графиков'),
 applied:{title:'Задачи по заданной формуле: общий метод',description:'Объяснение шагов перевода прикладного условия в уравнение. В статье сохранена старая нумерация.',provider:'РЕШУ ЕГЭ',format:'Памятка с примерами',url:'https://ege.sdamgia.ru/handbook?id=383',checked:'2026-11-18'},
 text:e(m+'zadanie-11-profilnogo-ege-po-matematike-tekstovye-zadachi/','Текстовые задачи: движение, работа и смеси'),
 extrema:e('zadanie-12-profilnogo-EGE-po-matematike','Исследование функций и экстремумы'),
 equationsFull:e(m+'zadanie-13-profilnogo-ege-po-matematike-uravneniya/','Уравнения второй части и отбор корней'),
 trigVideo:t('20-trigonometricheskie-uravneniya','Уравнения с отбором: подробные видеоразборы'),
 solidFull:e(m+'zadanie-14-profilnogo-ege-po-matematike-stereometriya/','Стереометрия: доказательство и вычисление'),
 inequalities:e(m+'zadanie-15-profilnogo-ege-po-matematike-neravenstva/','Неравенства: обзор типов и решений'),
 intervals:e(m+'metod-intervalov/','Метод интервалов: подробный разбор'),
 rationalization:e(m+'neravenstva-metod-zameny-mnozhitelja-metod-racionalizacii/','Метод рационализации и замены множителя'),
 finance:e(m+'zadanie-17-profilnogo-ege-po-matematike-finansovaya-matematika/','Финансовая математика и модели долга'),
 financeVideo:t('141-ekonomicheskaya-zadacha','Экономические задачи с видеоразборами'),
 planeFull:e(m+'zadanie-16-profilnogo-ege-po-matematike-planimetriya/','Планиметрия второй части'),
 planeFullVideo:t('96-planimetriya','Планиметрия: доказательства и разборы'),
 parameters:e(m+'zadanie-18-profilnogo-ege-po-matematike-zadacha-s-parametrami/','Параметры: с чего начать и какой метод выбрать'),
 parameterGraphs:e('graficheskij-metod-resheniya-zadach-s-parametrami/','Графический метод в задачах с параметром'),
 parameterFunctions:e('zadachi-s-parametrami-ispolzovanie-svojstv-funkcij-nepreryvnost-monotonnost-nechetnost/','Параметры и свойства функций'),
 numbers:e(m+'zadanie-19-profilnogo-ege-po-matematike-chisla-i-ix-svojstva/','Числа и свойства: подходы к нестандартным задачам'),
 numbersVideo:t('23-arifmetika-i-algebra','Теория чисел, оценки и конструкции: видеоразборы')
};
export const sourcesByNumber={1:['plane','planeVideo'],2:['vectors','vectorsVideo'],3:['solid','solidStream'],4:['probability','probabilityVideo'],5:['probability','probabilityVideo'],6:['equations','equationsVideo'],7:['transforms','equations'],8:['derivative','functions'],9:['applied','equations'],10:['text','equations'],11:['elementary','graphShift'],12:['extrema','derivative'],13:['equationsFull','trigVideo'],14:['solidFull','vectors'],15:['inequalities','intervals','rationalization'],16:['finance','financeVideo'],17:['planeFull','planeFullVideo'],18:['parameters','parameterGraphs','parameterFunctions'],19:['numbers','numbersVideo']};
