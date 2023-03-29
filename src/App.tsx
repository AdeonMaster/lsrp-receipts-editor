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

const AboutModal = () => {
  const { isOpen, toggle } = useModal('about')

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>О программе</ModalHeader>
      <ModalBody>
        <p>Редактор рецептов v0.0.3</p>

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

const AddReceiptModal = ({ rowData, setRowData, items }: RemoveConfirmModalProps) => {
  const { isOpen, toggle, params } = useModal('add')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [resultItem, setResultItem] = useState('')
  const [ingredients, setIngredients] = useState<{id: string, count: number}[]>([])
  const [id, setId] = useState('')
  const [price, setPrice] = useState(50)
  const [tier, setTier] = useState(0)

  useEffect(() => {
    setName(params?.data?.name || '')
    setDescription(params?.data?.description || '')
    setResultItem(params?.data?.resultItem || '')
    setIngredients(params?.data?.ingredients || [])
    setId(params?.data?.id || '')
    setPrice(params?.data?.price || 50)
    setTier(params?.data?.tier || 0)
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
          <Label for="exampleEmail">
            Название рецепта
          </Label>
          <Input readOnly={readOnly} value={name} onChange={(event) => setName(event.target.value)} />
          <FormText>* Название самого предмета</FormText>
        </FormGroup>

        <FormGroup>
          <Label for="exampleEmail">
            Дополнительное описание
          </Label>
          <Input readOnly={readOnly} type="textarea" value={description} onChange={(event) => setDescription(event.target.value)} />
          <FormText>* Будет выводиться внутри страницы с рецептом перед перечнем необходимых ресурсов</FormText>
        </FormGroup>

        <FormGroup>
          <Label for="exampleEmail">
            Предмет, получаемый в результате крафта
          </Label>

          <DropdownSearchSelect disabled={readOnly} placeholder="Выберите предмет" value={resultItem} onChange={(value) => {
            setResultItem(value)
            setId(`ITRC_${value.replace('IT', '')}`)
          }} options={items.map(i => ({ value: i.id, displayValue: `${i.name || ''} (${i.id})` }))} />
        </FormGroup>

        <FormGroup>
          <Label for="exampleEmail">
            Код рецепта
          </Label>
          <Input readOnly={readOnly} value={id} onChange={(event) => setId(event.target.value)} />
        </FormGroup>

        <FormGroup>
          <Label for="exampleEmail">
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
          <Label for="exampleEmail">
            Тир
          </Label>
          <Input disabled={readOnly} type="select" value={tier} onChange={(event) => setTier(Number(event.target.value))}>
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
          <Label for="exampleEmail">
            Цена
          </Label>
          <Input readOnly={readOnly} type="number" min="0" value={price} onChange={(event) => setPrice(Number(event.target.value))} />
        </FormGroup>
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
  { headerName: 'Цена', field: 'price', sortable: true, width: 80, },
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

const UploadButton = ({ onFileUpload, children, ...otherProps }: ButtonProps & { onFileUpload: (text: string) => void }) => {
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
      <Input innerRef={fileInput} type="file" className="d-none" onChange={handleFileUpload} />
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
  const body = instanceBody.replace(/\s/g, '').replace(/;$/g, '');
  const lines = body.split(';');

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
    const constans = extractConstants(content)

    const items = instances.filter(instance => instance.name.startsWith('it')).map(instance => {
      const name = instance.properties.find((prop) => prop && prop[0] === 'name')?.[1]

      return {
        id: instance.name.toLocaleUpperCase(),
        name: constans.find(c => c.name === name)?.value || name
      }
    })

    setItems(items)
  }

  const handleAboutBtnClick = () => {
    openModal('about')
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
    <div className="p-3">
      <div className="d-flex mb-3 flex-wrap align-items-center gap-2">
        <UploadButton color="primary" disabled={!!items.length} onFileUpload={handleScriptsFileUpload}><FontAwesomeIcon icon={faFileImport} className="me-1" />Импортировать декомпилированный GOTHIC.DAT</UploadButton>
        <Button color="primary" onClick={handleAboutBtnClick} ><FontAwesomeIcon icon={faCircleInfo} className="me-1" />О программе</Button>
      </div>

      <AboutModal />

      {items.length > 0 && (
        <div>
          <div className="d-flex align-items-center mb-3 gap-2">
            <Input onChange={handleChange} placeholder="Найти"/>

            <Button className="flex-shrink-0" color="success" onClick={handleAddBtnClick}><FontAwesomeIcon icon={faPlus} className="me-1" />Новый рецепт</Button>

            <UploadButton className="flex-shrink-0" color="primary" onFileUpload={handleImport}><FontAwesomeIcon icon={faFileImport} className="me-1" />Импортировать рецепты</UploadButton>
            <Button disabled={!rowData.length} className="flex-shrink-0" color="primary" onClick={handleExport}><FontAwesomeIcon icon={faFileExport} className="me-1" />Экспортировать рецепты</Button>
          </div>

          <div style={{height: '600px'}}>
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
        </div>
      )}
    </div>
  )
}

export default withModalContext(App)
