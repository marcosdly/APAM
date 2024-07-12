import { ChangeEvent, FC, useId, useReducer, useState } from 'react';
import { blankImage, InputProps } from './common';
import Wrapper from './Wrapper';

import './_file.scss';

export const File: FC<InputProps> = (props) => {
  const id = useId();
  const [filename, setFilename] = useState('');
  const [hasFile, toggleHasFile] = useReducer((bool: boolean) => !bool, false);

  const updateFileName = (ev: ChangeEvent) => {
    const elem = ev.currentTarget as HTMLInputElement;
    if (!elem || !elem.files?.length) {
      if (hasFile) toggleHasFile();
      setFilename('');
      return;
    }
    const file = elem.files?.item?.(0);
    if (!file) {
      if (hasFile) toggleHasFile();
      setFilename('');
      return;
    }
    setFilename(file.name);
    if (!hasFile) toggleHasFile();
  };

  return (
    <Wrapper className="admin-input__file" {...props}>
      <div className="choose">
        <div className="choose-button">
          <label htmlFor={id} className="choose-button-text">
            {hasFile ? 'Editar Arquivo' : 'Selecionar Arquivo'}
          </label>
          <input
            id={id}
            type="file"
            onChange={updateFileName}
            multiple={false}
            style={{ visibility: 'hidden' }}
          />
        </div>
        <label className="filename-label">{filename}</label>
      </div>
    </Wrapper>
  );
};

export const Image: FC<InputProps> = (props) => {
  const id = useId();
  const [imageUrl, setImageUrl] = useState(blankImage);
  const [hasImage, toggleHasImage] = useReducer(
    (bool: boolean) => !bool,
    false
  );

  const updatePreview = (ev: ChangeEvent) => {
    ev.preventDefault();
    const elem = ev.currentTarget as HTMLInputElement;
    if (!elem || !elem.files?.length) {
      // has at least 1 file
      if (hasImage) toggleHasImage();
      setImageUrl(blankImage);
      return;
    }
    const file = elem.files!.item(0);
    if (!file) {
      // double check: file object is returned
      if (hasImage) toggleHasImage();
      setImageUrl(blankImage);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    if (!hasImage) toggleHasImage();
  };

  return (
    <Wrapper className="admin-input__image" {...props}>
      <div className="preview-container">
        <label
          htmlFor={id}
          className={`image-message ${hasImage ? 'hidden' : ''}`}
        >
          {hasImage ? 'Editar' : 'Selecionar'}
        </label>
        <input
          type="file"
          id={id}
          className="image-input"
          multiple={false}
          onChange={updatePreview}
          style={{ visibility: 'hidden' }}
        />
        <img src={imageUrl} className="image-preview" />
      </div>
    </Wrapper>
  );
};
