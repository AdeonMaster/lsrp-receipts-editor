import { ColDef, GridApi, GridReadyEvent, GroupCellRendererParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { ChangeEvent, createContext, createRef, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Input, Button, ButtonProps, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, FormText, Label } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleInfo, faCopy, faEdit, faEye, faFileExport, faFileImport, faGripVertical, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'
import DropdownSearchSelect from './common/components/reactstrap/dropdown-search-select/dropdown-search-select';
import { indexBy, prop, values } from 'ramda';
// import { decode } from 'windows-1251';

const ModalContext = createContext<([string, React.Dispatch<React.SetStateAction<string>>] | [any, React.Dispatch<React.SetStateAction<any>>])[]>(null as any)

const ModalContextProvider = ({ children }: { children: ReactNode }) => {
  const state = useState('')
  const params = useState({})

  const value = useMemo(() => [state, params], [state, params])

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  )
}

const withModalContext = (Component: FC<any>) => () => (
  <ModalContextProvider>
    <Component />
  </ModalContextProvider>
)

const useModals = () => {
  const [[, setModal], [, setParams]] = useContext(ModalContext)

  const openModal = (name: string, params?: any) => {
    setParams(params)
    setModal(name)
  }

  return {
    openModal,
  }
}

const useModal = (name: string) => {
  const [[modal, setModal], [params]] = useContext(ModalContext)

  const isOpen = modal === name
  const toggle = () => setModal('')

  return {
    isOpen,
    params,
    toggle,
  }
}

type RemoveConfirmModalProps = {
  rowData: any[],
  setRowData: any,
  items: any[]
}

const RemoveConfirmModal = ({ rowData, setRowData }: RemoveConfirmModalProps) => {
  const { isOpen, toggle, params } = useModal('remove')

  const handleClick = () => {
    setRowData(rowData.filter(a => a.id !== params?.id))
    toggle()
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Удалить</ModalHeader>
      <ModalBody>
        Вы уверены, что хотите удалить данный элемент? ({params?.id})
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleClick}>
          Да
        </Button>
        <Button color="secondary" onClick={toggle}>
          Отмена
        </Button>
      </ModalFooter>
    </Modal>
  )
}

const RemoveAllModal = ({ setRowData }: RemoveConfirmModalProps) => {
  const { isOpen, toggle } = useModal('removeAll')

  const handleClick = () => {
    setRowData([])
    toggle()
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>Удалить</ModalHeader>
      <ModalBody>
        Вы уверены, что хотите удалить все элементы?
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={handleClick}>
          Да
        </Button>
        <Button color="secondary" onClick={toggle}>
          Отмена
        </Button>
      </ModalFooter>
    </Modal>
  )
}

const AboutModal = () => {
  const { isOpen, toggle } = useModal('about')

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>О программе</ModalHeader>
      <ModalBody>
        <p>Редактор рецептов v0.0.9</p>

        <p>Разработано <strong>AdeonMaster</strong> ака <strong>Арахисовая Корзинка</strong></p>

        <p>(c) 2023 Long Story Role Play</p>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          Закрыть
        </Button>
      </ModalFooter>
    </Modal>
  )
}

function splitter(str: string, l: number){
  var strs = [];
  while(str.length > l){
      var pos = str.substring(0, l).lastIndexOf(' ');
      pos = pos <= 0 ? l : pos;
      strs.push(str.substring(0, pos));
      var i = str.indexOf(' ', pos)+1;
      if(i < pos || i > pos+l)
          i = pos;
      str = str.substring(i);
  }
  strs.push(str);
  return strs;
}

type DaedalusModalProps = {
  rowData: any[],
}

const getItemNameFromInstance = (instance: string) => {
  //@ts-ignore
  const item = window.Daedalus.instances.find((a: any) => a.name.toUpperCase() === instance);
  if (!item) return ""

  const name = item.properties.find((p: any) => p[0] === "name")
  if (!name) return ""

  //@ts-ignore
  return window.Daedalus.constants.find((c: any) => c.name === name[1])?.value.replaceAll("\"", "") || name[1].replaceAll("\"", "")
}

const DaedalusModal = ({ rowData }: DaedalusModalProps) => {
  const { isOpen, toggle } = useModal('daedalus')

  const code = rowData.map((receipt) => {
    const descriptionParagraphs = receipt.description.replaceAll("\"", "'").split("\n");
    const lines = descriptionParagraphs.reduce((acc: string[], p: string) => {
      const chunks = splitter(p, 48)

      return [...acc, chunks.map(chunk => `	Doc_PrintLine(nDocID,0,"${chunk}");`).join('\n')]
    }, []);

    const ingredients = receipt.ingredients.map(({id, count}: any) => `	Doc_PrintLine(nDocID,0,"- x${count} ${getItemNameFromInstance(id)}");`).join('\n');

    return `instance ${receipt.id}(Prototype_Receipt)
{
	name = "Рецепт: ${receipt.name}";
	on_state[0] = Use${receipt.id};
	text[2] = "Инструкция по изготовлению";
	text[3] = "${receipt.name}";
	visual_change = "${receipt.ingredients.map(({id, count}: any) => `${id}:${count}`).join(',')}";
};

func void Use${receipt.id}()
{
	var int nDocID;
	nDocID = Doc_Create();
	Doc_SetPages(nDocID,1);
	Doc_SetPage(nDocID,0,"letters.TGA",0);
	Doc_SetFont(nDocID,0,FONT_BookHeadline);
	Doc_SetMargins(nDocID,-1,50,50,50,50,1);
	Doc_PrintLine(nDocID,0,${receipt.id}.text[3]);
	Doc_SetFont(nDocID,0,FONT_Book);
	Doc_PrintLine(nDocID,0,"");
  ${lines.join('\n')}
	Doc_PrintLine(nDocID,0,"");
	Doc_PrintLine(nDocID,0,"Ингредиенты:");
  ${ingredients}
	Doc_PrintLines(nDocID,0,"");
	Doc_Show(nDocID);
};
`}).join('\n')
  const xml = rowData.map((receipt) => `<item><instance>${receipt.id}</instance></item>`).join('\n')

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Код</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="exampleEmail">
            Daedalus код
          </Label>
          <Input type="textarea" readOnly value={code} style={{ minHeight: '500px' }} />
        </FormGroup>

        <FormGroup>
          <Label for="exampleEmail">
            items.xml
          </Label>
          <Input type="textarea" readOnly value={xml} style={{ minHeight: '100px' }} />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>
          Закрыть
        </Button>
      </ModalFooter>
    </Modal>
  )
}

const AddReceiptModal = ({ rowData, setRowData, items }: RemoveConfirmModalProps) => {
  const { isOpen, toggle, params } = useModal('add')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [resultItem, setResultItem] = useState('')
  const [ingredients, setIngredients] = useState<{id: string, count: number}[]>([])
  const [id, setId] = useState('')
  const [price, setPrice] = useState(50)
  const [tier, setTier] = useState(0)
  const [category, setCategory] = useState('')
  const [isSystemReceipt, setIsSystemReceipt] = useState(false)

  useEffect(() => {
    setName(params?.data?.name || '')
    setDescription(params?.data?.description || '')
    setResultItem(params?.data?.resultItem || '')
    setIngredients(params?.data?.ingredients || [])
    setId(params?.data?.id || '')
    setPrice(params?.data?.price || 50)
    setTier(params?.data?.tier || 0)
    setCategory(params?.data?.category || '')
    setIsSystemReceipt(params?.data?.isSystemReceipt || false)
  }, [params])

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { id: '', count: 1 }])
  }

  const handleItemIngredient = (idxToChange: number) => (value: string) => {
    setIngredients(ingredients.map((a, idx) => idx === idxToChange ? ({ ...a, id: value }) : a))
  }

  const handleCountIngredient = (idxToChange:number, value: number) => {
    setIngredients(ingredients.map((a, idx) => idx === idxToChange ? ({ ...a, count: value }) : a))
  }

  const handleRemoveIngredient = (idxToRemove: number) => () => {
    setIngredients(ingredients.filter((a, idx) => idx !== idxToRemove))
  }

  const [error, setError] = useState('')

  const handleClick = () => {
    const item = {
      id: id.toUpperCase(),
      name,
      description,
      ingredients,
      resultItem,
      price,
      tier,
      category,
      isSystemReceipt,
    }

    if (!name.length) {
      setError('Название рецепта не может быть пустым')
      return
    }

    if (!resultItem.length) {
      setError('Предмет, получаемый в результате крафта, не может быть пустым')
      return
    }

    if (!ingredients.length) {
      setError('Список ингредиентов пуст')
      return
    }

    if (params?.type === 'edit') {
      setRowData(rowData.map(a => a.id === item.id ? item : a))
    } else {
      if (rowData.find(a => a.id === item.id)) {
        setError('Рецепт с данным кодом уже существует')
        return
      }

      setRowData([...rowData, item])
    }

    setError('')
    toggle()
  }

  const readOnly = params?.type === 'view'

  const title = params?.type === 'view'
    ? 'Просмотреть рецепт'
    : params?.type === 'edit'
      ? 'Редактировать рецепт'
      : 'Новый рецепт'

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>
        {error && <Alert color="danger"><strong>Ошибка:</strong> {error}</Alert>}

        <FormGroup>
          <Label for="name">
            Название рецепта
          </Label>
          <Input id="name" readOnly={readOnly} value={name} onChange={(event) => setName(event.target.value)} />
          <FormText>* Название самого предмета</FormText>
        </FormGroup>

        <FormGroup>
          <Label for="description">
            Дополнительное описание
          </Label>
          <Input id="description" readOnly={readOnly} type="textarea" value={description} onChange={(event) => setDescription(event.target.value)} />
          <FormText>* Будет выводиться внутри страницы с рецептом перед перечнем необходимых ресурсов</FormText>
        </FormGroup>

        <FormGroup>
          <Label for="resultItem">
            Предмет, получаемый в результате крафта
          </Label>

          <DropdownSearchSelect id="resultItem" disabled={readOnly} placeholder="Выберите предмет" value={resultItem} onChange={(value) => {
            setResultItem(value)
            setId(`ITRC_${value.replace('IT', '')}`)
          }} options={items.map(i => ({ value: i.id, displayValue: `${i.name || ''} (${i.id})` }))} />
        </FormGroup>

        <FormGroup>
          <Label for="instance">
            Код рецепта
          </Label>
          <Input id="instance" readOnly={readOnly} value={id} onChange={(event) => setId(event.target.value)} />
        </FormGroup>

        <FormGroup>
          <Label>
            Ингредиенты, необходимые для крафта ({ingredients.length})
          </Label>

          {!readOnly && <div>
            <Button color="success" size="sm" onClick={handleAddIngredient}><FontAwesomeIcon icon={faPlus} /></Button>
          </div>}

          {ingredients.length > 0 && (
            <div className="row">
              <div className="col-lg-1">
              </div>
              <div className="col-lg-7">
                <Label>Предмет</Label>
              </div>
              <div className="col-lg-2">
                <Label>Кол-во</Label>
              </div>
              <div className="col-lg-2">
                <Label>Действия</Label>
              </div>
            </div>
          )}

          {ingredients.map((ingredient, idx) => (
            <div className="row mb-3" key={idx}>
              <div className="col-lg-1 d-flex align-items-center justify-content-end">
                <FontAwesomeIcon title="Переместить" icon={faGripVertical} />
              </div>
              <div className="col-lg-7">
                <DropdownSearchSelect disabled={readOnly} placeholder="Выберите предмет" value={ingredient.id} onChange={handleItemIngredient(idx)} options={items.map(i => ({ value: i.id, displayValue: `${i.name || ''} (${i.id})` }))} />
              </div>
              <div className="col-lg-2">
                <Input readOnly={readOnly} value={ingredient.count} type="number" min="1" max="99" onChange={(event) => handleCountIngredient(idx, Number(event.target.value))}/>
              </div>
              <div className="col-lg-2 d-flex align-items-center">
                {!readOnly && <FontAwesomeIcon title="Удалить" icon={faTrash} className="text-danger cursor-pointer" onClick={handleRemoveIngredient(idx)} />}
              </div>
            </div>
          ))}
        </FormGroup>

        <FormGroup>
          <Label for="tier">
            Тир
          </Label>
          <Input id="tier" disabled={readOnly} type="select" value={tier} onChange={(event) => setTier(Number(event.target.value))}>
            <option value="" disabled>Выберите тир</option>
            <option value="0">T0</option>
            <option value="1">T1</option>
            <option value="2">T2</option>
            <option value="3">T3</option>
            <option value="4">T4</option>
            <option value="5">T5</option>
            <option value="6">T6</option>
          </Input>
        </FormGroup>

        <FormGroup>
          <Label for="category">
            Категория
          </Label>
          <Input id="category" disabled={readOnly} type="select" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="" disabled>Выберите категорию</option>
            <option value="runes">Создание рун</option>
            <option value="alchemy">Алхимия</option>
            <option value="smith">Кузнечное дело</option>
            <option value="jewelry">Ювелирное дело</option>
            <option value="cooking">Готовка</option>
            <option value="carpentry">Плотничное дело</option>
            <option value="leatherworking">Кожевенное дело</option>
            <option value="other">Другое</option>
          </Input>
        </FormGroup>

        <FormGroup>
          <Label for="price">
            Цена
          </Label>
          <Input id="price" readOnly={readOnly} type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} />
        </FormGroup>

        <FormGroup check>
          <Input id="isSystemReceipt" readOnly={readOnly} disabled={readOnly} type="checkbox" checked={isSystemReceipt} onChange={(event) => setIsSystemReceipt(event.target.checked)} />
          <Label for="isSystemReceipt">
            Это системный рецепт
          </Label>
        </FormGroup>
        <FormText>* Так называемые системные рецепты крафта не должны иметь игрового предмета для изучения. Данные рецепты используются в механике взаимодействия с MOBSI</FormText>
      </ModalBody>

      <ModalFooter>
        {!readOnly && (
          <Button color="primary" onClick={handleClick}>
            {params?.type === 'edit' ? 'Изменить' : 'Добавить'}
          </Button>
        )}
        <Button color="secondary" onClick={toggle}>
          Отмена
        </Button>
      </ModalFooter>
    </Modal>
  )
}

const ActionsCellRenderer = (params: GroupCellRendererParams) => {
  const { openModal } = useModals()

  const handleRemove = () => {
    openModal('remove', { type: 'remove', id: params.data.id })
  }

  const handleCopy = () => {
    openModal('add', { type: 'copy', data: params.data })
  }

  const handleEdit = () => {
    openModal('add', { type: 'edit', data: params.data })
  }

  const handleView = () => {
    openModal('add', { type: 'view', data: params.data })
  }

  return (
    <div className='d-flex align-items-center gap-2 h-100'>
      <FontAwesomeIcon title="Просмотреть" icon={faEye} className="text-dark cursor-pointer" onClick={handleView} />
      <FontAwesomeIcon title="Копировать" icon={faCopy} className="text-primary cursor-pointer" onClick={handleCopy} />
      <FontAwesomeIcon title="Редактировать" icon={faEdit} className="text-primary cursor-pointer" onClick={handleEdit} />
      <FontAwesomeIcon title="Удалить" icon={faTrash} className="text-danger cursor-pointer" onClick={handleRemove} />
    </div>
  )
}

const columnDefs: ColDef[] = [
  { headerName: "Код", field: "id", sortable: true },
  { headerName: "Название", field: "name", sortable: true },
  { headerName: 'Описание', field: 'description', sortable: true },
  { headerName: 'Ингредиенты', field: 'ingredients', valueFormatter: ({ value }) => value.map((i: any) => `x${i.count} ${i.id}`).join(', '), sortable: true },
  { headerName: 'Итоговый предмет', field: 'resultItem', sortable: true },
  { headerName: 'Тир', field: 'tier', sortable: true, valueFormatter: ({ value }) => "T" + value, width: 60, },
  { headerName: 'Категория', field: 'category', sortable: true },
  { headerName: 'Цена', field: 'price', sortable: true, width: 80, },
  { headerName: 'Системный рецепт', field: 'isSystemReceipt', sortable: true, filter: 'agTextColumnFilter' },
  { headerName: '', field: 'dummy', flex: 1, suppressMovable: true },
  { headerName: 'Действия', field: "actions", cellRenderer: ActionsCellRenderer },
]

function download(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

const UploadButton = ({ onFileUpload, accept, children, ...otherProps }: ButtonProps & { onFileUpload: (text: string) => void, accept?: string }) => {
  const fileInput = createRef<HTMLInputElement>()

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return

    const fileReader = new FileReader();

    fileReader.onload = function() {
      onFileUpload(fileReader.result as string)

      event.target.value = ''
    }

    fileReader.readAsText(event.target.files[0]);
  }

  const handleImport = () => {
    fileInput?.current?.click()
  }

  return (
    <>
      <Input innerRef={fileInput} type="file" accept={accept} className="d-none" onChange={handleFileUpload} />
      <Button {...otherProps} onClick={handleImport}>{children}</Button>
    </>
  )
}

const constantsRegExpr = /const (.+) (.+) = (.+);/g;
const instanceRegExpr = /instance (it.+)\((.+)\) \{([\S\s]+?)\};/g;
const prototypeRegExpr = /prototype (it.+)\((.+)\) \{([\S\s]+?)\};/g;
const functionsRegExpr = /func (.+?) (.+?)\((.+?)?\) {([\s\S]+?)};\r\n\r\n/g;

const getItemMetaCategory = (name: string) => {
  const match = name.match(/it(\S\S)_/i);

  if (!match) return '';

  switch (match[1]) {
      case 'am':
          return 'amulet';
      case 'at':
          return 'animalTrophy';
      case 'ar':
          return 'armor';
      case 'fo':
          return 'food';
      case 'ke':
          return 'key';
      case 'mw':
          return 'meleeWeapon';
      case 'mi':
          return 'misc';
      case 'rw':
          return 'rangedWeapon';
      case 'ri':
          return 'ring';
      case 'ru':
          return 'rune';
      case 'sc':
          return 'scroll';
      case 'se':
          return 'secret';
      case 'wr':
          return 'written';
      case 'be':
          return 'belt';
      case 'po':
          return 'potion';
      case 'pl':
          return 'plant';

      case 'he':
          return 'helmet';
      case 'hc':
          return 'houseCraft';

      case 'sh':
          return 'shield';
      case 'rc':
          return 'receipt';

      default:
          return 'unknown';
  }
}

const extractConstants = (file: string) => [...file.matchAll(constantsRegExpr)].map(([,type,name,value]) => ({
  type,
  name,
  value: type === 'int' ? Number(value) : value
}));

const extractFunctions = (file: string) => [...file.matchAll(functionsRegExpr)].map(([,returnType, name, paramList, body]) => ({
  returnType,
  name,
  paramList,
  body,
}));

const extractInstanceProperties = (instanceBody: string) => {
  const body = instanceBody.replace(/\s(?=(?:"[^"]*"|[^"])*$)/g, '').replace(/;$/g, '');
  const lines = body.split(';');

  console.log(body)

  return lines.map((line) => {
      const parts = line.split('=');

      if (parts.length === 2) {
        return [parts[0], parts[1]];
      }

      return null;
  }).filter((item) => item !== null);
}

const extractInstances = (file: string) => [...file.matchAll(instanceRegExpr)].map(([,name,proto,body]) => ({
  name,
  proto,
  properties: extractInstanceProperties(body),
  _meta: {
    category: getItemMetaCategory(name),
  },
}));

const App = () => {
  const { openModal } = useModals()
  const [api, setApi] = useState<GridApi | null>(null)
  const [rowData, setRowData] = useState(JSON.parse(localStorage.getItem('receipts') || '[]'));
  const [items, setItems] = useState<{
      id: string;
      name: string | number | undefined;
  }[]>([])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (api) {
      api.setQuickFilter(event.target.value);
    }
  }

  const handleAddBtnClick = () => {
    openModal('add')
  }

  const handleRemoveAllBtnClick = () => {
    openModal('removeAll')
  }

  const handleGridReady = (event: GridReadyEvent) => {
    setApi(event.api)
  }

  const handleExport = () => {
    const name = "рецепты " + new Date().toISOString().replace('T', ' ').replace('Z', '').replace(/:/g,'-').replace(/\.\d\d\d/, '') + ".json"

    download(name, JSON.stringify(rowData))
  }

  const handleImport = (text: string) => {
    const current = indexBy(prop('id'), rowData)
    const imported = indexBy(prop('id'), JSON.parse(text))

    const result = values({...current, ...imported })

    localStorage.setItem('receipts', JSON.stringify(result))

    setRowData(result)
  }

  const handleScriptsFileUpload = (text: string) => {
    const content = text // decode(text)
    const instances = extractInstances(content)
    const constants = extractConstants(content)

    //@ts-ignore
    window.Daedalus = {
      instances,
      constants,
    }

    const items = instances.filter(instance => instance.name.startsWith('it') && instance.name !== 'item').map(instance => {
      const name = instance.properties.find((prop) => prop && prop[0] === 'name')?.[1] || '(Без названия)'

      return {
        id: instance.name.toLocaleUpperCase(),
        name: constants.find(c => c.name === name)?.value || name
      }
    })

    setItems(items)
  }

  const handleAboutBtnClick = () => {
    openModal('about')
  }

  const handleViewBtnClick = () => {
    openModal('daedalus')
  }

  useEffect(() => {
    const callback = () => {
      if (items.length > 0) {
        localStorage.setItem('receipts', JSON.stringify(rowData))
      }
    }

    const interval = setInterval(callback, 60000);

    window.addEventListener('beforeunload', callback)

    return () => {
      clearInterval(interval)

      window.removeEventListener('beforeunload', callback)
    }
  }, [rowData, items])

  return (
    <div className="p-3 vh-100 d-flex flex-column">
      <div className="d-flex mb-3 flex-wrap align-items-center gap-2">
        <UploadButton accept=".d" color="primary" disabled={!!items.length} onFileUpload={handleScriptsFileUpload}><FontAwesomeIcon icon={faFileImport} className="me-1" />Импортировать декомпилированный GOTHIC.DAT</UploadButton>
        <Button color="primary" onClick={handleAboutBtnClick} ><FontAwesomeIcon icon={faCircleInfo} className="me-1" />О программе</Button>
      </div>

      <AboutModal />

      {items.length > 0 && (
        <div className="flex-grow-1 d-flex flex-column">
          <div className="d-flex align-items-center mb-3 gap-2">
            <Input onChange={handleChange} placeholder="Найти"/>

            <Button className="flex-shrink-0" color="success" onClick={handleAddBtnClick}><FontAwesomeIcon icon={faPlus} className="me-1" />Новый рецепт</Button>
            <Button disabled={!rowData.length} className="flex-shrink-0" color="danger" onClick={handleRemoveAllBtnClick}><FontAwesomeIcon icon={faTrash} className="me-1" />Удалить все</Button>

            <UploadButton className="flex-shrink-0" color="primary" onFileUpload={handleImport}><FontAwesomeIcon icon={faFileImport} className="me-1" />Импортировать рецепты</UploadButton>
            <Button disabled={!rowData.length} className="flex-shrink-0" color="primary" onClick={handleExport}><FontAwesomeIcon icon={faFileExport} className="me-1" />Экспортировать рецепты</Button>

            <Button className="flex-shrink-0" color="primary" onClick={handleViewBtnClick}><FontAwesomeIcon icon={faEye} className="me-1" />Daedalus код</Button>
          </div>

          <div className="flex-grow-1">
            <AgGridReact
              className="ag-theme-alpine"
              columnDefs={columnDefs}
              rowData={rowData}
              onGridReady={handleGridReady}
              overlayNoRowsTemplate={'Список элементов пуст'}
            />
          </div>

          <RemoveConfirmModal rowData={rowData} setRowData={setRowData} items={items} />
          <AddReceiptModal rowData={rowData} setRowData={setRowData} items={items} />
          <RemoveAllModal rowData={rowData} setRowData={setRowData} items={items} />
          <DaedalusModal rowData={rowData} />
        </div>
      )}
    </div>
  )
}

export default withModalContext(App)
