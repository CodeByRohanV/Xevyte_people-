package com.register.example.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "global_settings")
public class GlobalSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", nullable = false, length = 150)
    private String settingKey; // Category key (e.g., "GENERAL_SETTINGS"). Not unique to allow multiple slides.

    @Lob
    @Column(name = "media_data", columnDefinition = "LONGBLOB")
    private byte[] mediaData; // BLOB data

    @Column(name = "content", length = 2000)
    private String content;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public byte[] getMediaData() {
        return mediaData;
    }

    public void setMediaData(byte[] mediaData) {
        this.mediaData = mediaData;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
