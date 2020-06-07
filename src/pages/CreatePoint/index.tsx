import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { FiArrowLeft } from 'react-icons/fi';

import './styles.css';
import logo from '../../assets/logo.svg';

interface IBGEUFResponse {
  sigla: string
}

interface IBGECityResponse {
  nome: string
}

interface Item {
  id: number;
  title: string;
  image_url: string;
}

const CreatePoint = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const [ufs, setUfs] = useState<string[]>([]);
  const [selectedUf, setSelecedtUf] = useState<string>('0');

  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('0');

  const [initialPosition, setInitialPosition] = useState<[number,number]>([0,0]);
  const [selectedPosition, setSelectedPosition] = useState<[number,number]>([0,0]);

  const history = useHistory();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setInitialPosition([
        latitude,
        longitude
      ])
    })
  }, [])

  useEffect(() => {
    api.get('/items').then(res => {
      setItems(res.data)
    })
  }, [])
  
  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(res => {
        const ufInitials = res.data.map(uf => uf.sigla);
        setUfs(ufInitials);
      })
  }, [])

  useEffect(() => {
    setSelectedCity('');
    if (selectedUf === '0') {
      setCities([]);
      return;
    }

    axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(res => {
        const citiesInitials = res.data.map(city => city.nome);
        setCities(citiesInitials);
      })
  }, [selectedUf])

  function handleSelectUf(e: ChangeEvent<HTMLSelectElement>) {
    const uf = e.target.value;
    setSelecedtUf(uf);
  }

  function handleSelectCity(e: ChangeEvent<HTMLSelectElement>) {
    const city = e.target.value;
    setSelectedCity(city);
  }

  function handleMapClick(e: LeafletMouseEvent) {
    setSelectedPosition([
      e.latlng.lat,
      e.latlng.lng
    ]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value })
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);
 
    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter(item => item !== id)
      setSelectedItems(filteredItems);
    }
    else
      setSelectedItems([ ...selectedItems, id ]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const [ latitude, longitude ] = selectedPosition;
    const data = { 
      ...formData, 
      uf: selectedUf,
      city: selectedCity,
      items: selectedItems,
      latitude,
      longitude
    }

    await api.post('points', data);

    alert('Ponto de coleta criado!');

    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta"/>

        <Link to="/">
            <FiArrowLeft />
            Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do ponto <br />
          ponto de coleta
        </h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input 
              type="text"
              id="name"
              name="name"
              onChange={handleInputChange}
            />
          </div>
          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input 
                type="email"
                id="email"
                name="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input 
                type="text"
                id="whatsapp"
                name="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select 
                value={selectedUf} 
                onChange={handleSelectUf} 
                name="uf" 
                id="uf"
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select 
                value={selectedCity} 
                onChange={handleSelectCity} 
                name="city" 
                id="city"
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
        
        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>
          
          <ul className="items-grid">
            {items.map(item => (
              <li 
                key={ item.id } 
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}
              >
                <img src={ item.image_url } alt={ item.title }/>
                <span>{ item.title }</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar ponto de coleta
        </button>
      </form>
    </div>
  );
}

export default CreatePoint;
