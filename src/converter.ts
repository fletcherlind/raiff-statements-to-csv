import type { Row } from 'read-excel-file';
import readXlsxFile from 'read-excel-file';
import config from './config.json';

const SEPARATOR = ',';
const CATEGORY_MATCH_MAP_KEY = 'CATEGORY_MATCH_MAP';

type CategoriesMatchMap = Record<string, string[]>;

export function setupConverter(uploadBtnEl: HTMLLabelElement) {
    let categoriesMatchMap = loadCategoriesMatchMap();

    const uploadInputEl = uploadBtnEl.getElementsByTagName('input')[0];
    const categoriesEls = {
        editorWrapper: document.querySelector('#categories-editor')!,
        editorLines: <HTMLTextAreaElement>document.querySelector('#categories-editor .js-editor-lines')!,
        textarea: <HTMLTextAreaElement>document.querySelector('#categories-editor .js-editor')!,
        uploadInput: <HTMLInputElement>document.querySelector('#categories-actions .js-upload-btn input')!,
        editBtn: <HTMLButtonElement>document.querySelector('#categories-actions .js-edit-btn')!,
        cancelBtn: <HTMLButtonElement>document.querySelector('#categories-editor .js-cancel-btn')!,
        saveBtn: <HTMLButtonElement>document.querySelector('#categories-editor .js-save-btn')!,
        resetBtn: <HTMLButtonElement>document.querySelector('#categories-editor .js-reset-btn')!,
        exportBtn: <HTMLButtonElement>document.querySelector('#categories-editor .js-export-btn')!,
    };

    categoriesEls.editBtn.addEventListener('click', onCategoriesMatchMapEdit);
    categoriesEls.cancelBtn.addEventListener('click', onCategoriesMatchMapCancel);
    categoriesEls.saveBtn.addEventListener('click', onCategoriesMatchMapSave);
    categoriesEls.resetBtn.addEventListener('click', onCategoriesMatchMapReset);
    categoriesEls.exportBtn.addEventListener('click', onCategoriesMatchMapExport);

    categoriesEls.uploadInput.addEventListener('change', onCategoriesMatchMapUpload);
    uploadBtnEl.addEventListener('change', onFileUpload);

    categoriesEls.textarea.addEventListener('input', onEditorChange);
    new MutationObserver(() => onEditorChange())
        .observe(categoriesEls.textarea, { childList: true });

    ///

    function onCategoriesMatchMapUpload() {
        const reader = new FileReader();
        reader.onload = async function() {
            await saveCategoryRecord(reader.result)
                .then((savedRecord) => {
                    categoriesMatchMap = savedRecord;
                    categoriesEls.textarea.textContent = JSON.stringify(savedRecord, null, 2);
                })
                .catch(alert);
            categoriesEls.uploadInput.value = '';
        }

        if (categoriesEls.uploadInput?.files)
            reader.readAsText(categoriesEls.uploadInput.files[0]);
    }

    function onCategoriesMatchMapEdit() {
        categoriesEls.textarea.textContent = JSON.stringify(categoriesMatchMap, null, 2);
        categoriesEls.editorWrapper.classList.toggle('hidden');
    }

    function onCategoriesMatchMapSave() {
        saveCategoryRecord(categoriesEls.textarea?.textContent)
            .then(() => categoriesEls.editorWrapper.classList.toggle('hidden'))
            .catch(alert)
    }

    function onCategoriesMatchMapCancel() {
        categoriesEls.editorWrapper.classList.toggle('hidden');
    }

    function onCategoriesMatchMapReset() {
        categoriesMatchMap = config.categoriesMatchMap;
        localStorage.setItem(CATEGORY_MATCH_MAP_KEY, JSON.stringify(config.categoriesMatchMap));
        categoriesEls.textarea.textContent = JSON.stringify(config.categoriesMatchMap, null, 2);
    }

    function onCategoriesMatchMapExport() {
        const categoriesMatchMap = localStorage.getItem(CATEGORY_MATCH_MAP_KEY)!;
        saveFile(categoriesMatchMap, 'categories-match-map.json')
    }

    function onFileUpload() {
        // titleEl.textContent = uploadInputEl?.files && uploadInputEl.files[0].name;
        // titleEl.textContent = 'Converting...';
        console.log('files', uploadInputEl?.files);

        if (!uploadInputEl.files) return;
        readXlsxFile(uploadInputEl.files[0]).then(async (rows) => {
            // titleEl.textContent = 'Converted!';
            uploadInputEl.value = '';
            await saveFile(convertToCsv(rows, categoriesMatchMap), 'Statement.csv');
        })
    }

    function onEditorChange() {
        const linesCount = String(categoriesEls.textarea.innerText).split(/\n/).length;

        categoriesEls.editorLines.innerText = '';
        for (let i = 0; i < linesCount; i++) {
            categoriesEls.editorLines.appendChild(document.createElement('li'));
        }
    }
}

///

function loadCategoriesMatchMap(): CategoriesMatchMap {
    let userCategoriesMatchMap = null;

    try {
        userCategoriesMatchMap = JSON.parse(localStorage.getItem(CATEGORY_MATCH_MAP_KEY) ?? '');
    } catch (e) {}

    return userCategoriesMatchMap
        ? userCategoriesMatchMap
        : config.categoriesMatchMap;
}

function convertToCsv(rows: Row[], categoriesMatchMap: CategoriesMatchMap) {
    const result = rows
        .filter((row) => row[0] instanceof Date)
        .map(row => ({
            date: row[0] as unknown as Date,
            desc: String(row[4] as unknown as string)
                .replace(/\n/gi, '')
                .replaceAll(SEPARATOR, ''),
            amountRsd: (+row[9] - +row[8]),
        }))
        .map(row => [
            row.date.toLocaleDateString('en-GB'),
            matchCategory(row.desc),
            row.desc,
            row.amountRsd,
        ])
        .map(row => row.join(SEPARATOR))
        .join('\n');

    const header = ['Date', 'Category', 'Note', 'Amount']
        .join(SEPARATOR);

    return `${header}\n${result}`;

    ///

    function matchCategory<T extends keyof CategoriesMatchMap>(desc: string): T {
        return (Object.keys(categoriesMatchMap) as T[])
            .find(categoryMatcher) ?? <T>'Other';

        function categoryMatcher(categoryName: string): boolean {
            const keywords = categoriesMatchMap[categoryName];
            return keywords.some(keyword =>
                String(desc).toUpperCase().includes(keyword.toUpperCase())
            );
        }
    }

}

function saveCategoryRecord(record: any): Promise<any> {
    return new Promise((resolve, reject) => {
        console.log('== SAVE CATEGORY MATCH SETTING ===');
        try {
            const updatedRecord = JSON.parse(record);
            localStorage.setItem(CATEGORY_MATCH_MAP_KEY, JSON.stringify(updatedRecord));
            resolve(updatedRecord);
            console.log('== SAVED ===');
        } catch (e) {
            console.warn('== SAVE FAILED ===');
            reject(e);
        }
    })
}

async function saveFile(content: string, name: string) {
    console.log('content', content);
    const opts = {
        suggestedName: name,
    };

    const fileHandle = await window.showSaveFilePicker(opts);
    const fileStream = await fileHandle.createWritable();
    await fileStream.write(new Blob([content], {type: "text/plain"}));
    await fileStream.close();
}